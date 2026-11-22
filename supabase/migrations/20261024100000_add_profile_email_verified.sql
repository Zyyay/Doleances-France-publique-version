-- Our own record of whether a user's e-mail address was actually verified.
--
-- Supabase's "Confirm email" setting was turned off (2026-10-24) to let new
-- accounts vote immediately. With it off, Supabase auto-confirms every new
-- e-mail signup — auth.users.email_confirmed_at gets filled at creation time
-- for everyone, so it can no longer tell a verified address from an
-- unverified one. This column keeps that distinction so unverified accounts
-- can be caught up later (see EMAIL_VERIFICATION_REQUIRED in
-- lib/auth/featureFlags.ts).

alter table public.profiles add column email_verified boolean not null default false;

comment on column public.profiles.email_verified is 'True once the address is known to be verified: a real confirmation-link click, or a Google identity. Never writable by the user themselves (see protect_profile_email_verified).';

-- ---------------------------------------------------------------------------
-- The existing RLS policies let a user insert/update their own profile row,
-- any column included — without this guard anyone could flip their own
-- email_verified to true straight through the REST API. Requests made as the
-- `authenticated`/`anon` roles can never change it; security definer
-- functions (owned by postgres) and the service role still can.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_email_verified()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.email_verified := false;
    else
      new.email_verified := old.email_verified;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_email_verified
before insert or update on public.profiles
for each row execute function public.protect_profile_email_verified();

-- ---------------------------------------------------------------------------
-- Google verifies the address itself, so a Google identity — on a brand-new
-- account or linked onto an anonymous session via linkIdentity() — marks the
-- profile verified. The profile row already exists by then: handle_new_user()
-- fires on the auth.users insert, which happens before the identity insert.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider = 'google' then
    update public.profiles set email_verified = true where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger on_auth_identity_created
after insert on auth.identities
for each row execute function public.handle_new_identity();

-- ---------------------------------------------------------------------------
-- Backfill existing accounts. email_confirmed_at alone is no longer
-- trustworthy: accounts created after the setting was turned off were
-- auto-confirmed at creation (email_confirmed_at ≈ created_at). A real
-- confirmation always lands later than signup — the user has to open the
-- mail and click — so the 10-second gap separates the two.
-- ---------------------------------------------------------------------------
update public.profiles p
set email_verified = true
from auth.users u
where u.id = p.user_id
  and (
    exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google')
    or (u.email_confirmed_at is not null and u.email_confirmed_at > u.created_at + interval '10 seconds')
  );
