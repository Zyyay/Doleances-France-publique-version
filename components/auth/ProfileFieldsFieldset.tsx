"use client";

import { useState } from "react";
import { EDUCATION_LEVELS, FRENCH_DEPARTMENTS, GENDERS, WORLD_ZONES } from "@/lib/auth/profileOptions";
import styles from "./auth.module.css";

export interface ProfileFieldDefaults {
  birth_year?: number | null;
  is_expat?: boolean;
  department?: string | null;
  education_level?: string | null;
  gender?: string | null;
}

export function ProfileFieldsFieldset({
  defaults,
  fieldErrors,
}: {
  defaults?: ProfileFieldDefaults;
  fieldErrors?: Record<string, string>;
}) {
  const [isExpat, setIsExpat] = useState(defaults?.is_expat ?? false);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        Informations optionnelles
        <span className={styles.legendHint}>
          Jamais requises pour voter ou consulter le site, ces données sont utilisées uniquement pour éclairer les
          résultats de façon anonymisée.
        </span>
      </legend>

      <div className={styles.field}>
        <label htmlFor="birth_year">Année de naissance</label>
        <input
          id="birth_year"
          name="birth_year"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="ex. 1990"
          defaultValue={defaults?.birth_year ?? ""}
        />
        {fieldErrors?.birth_year && <p className={styles.fieldError}>{fieldErrors.birth_year}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="department">{isExpat ? "Zone de résidence" : "Département"}</label>
        <div className={styles.departmentRow}>
          {isExpat ? (
            <select id="department" name="department" defaultValue="" key="zone">
              <option value=""></option>
              {WORLD_ZONES.map((zone) => (
                <option key={zone.code} value={zone.code}>
                  {zone.name}
                </option>
              ))}
            </select>
          ) : (
            <select id="department" name="department" defaultValue={defaults?.department ?? ""} key="department">
              <option value=""></option>
              {FRENCH_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
          )}
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              name="is_expat"
              checked={isExpat}
              onChange={(e) => setIsExpat(e.target.checked)}
            />
            Français résidant à l&apos;étranger
          </label>
        </div>
        {fieldErrors?.department && <p className={styles.fieldError}>{fieldErrors.department}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="education_level">Niveau d&apos;étude</label>
        <select id="education_level" name="education_level" defaultValue={defaults?.education_level ?? ""}>
          <option value=""></option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {fieldErrors?.education_level && <p className={styles.fieldError}>{fieldErrors.education_level}</p>}
      </div>

      <div className={styles.field}>
        <span className={styles.groupLabel}>Sexe</span>
        <div className={styles.radioRow}>
          <label className={styles.checkboxRow}>
            <input type="radio" name="gender" value="" defaultChecked={!defaults?.gender} />
            Ne souhaite pas répondre
          </label>
          {GENDERS.map((g) => (
            <label className={styles.checkboxRow} key={g.value}>
              <input type="radio" name="gender" value={g.value} defaultChecked={defaults?.gender === g.value} />
              {g.label}
            </label>
          ))}
        </div>
        {fieldErrors?.gender && <p className={styles.fieldError}>{fieldErrors.gender}</p>}
      </div>
    </fieldset>
  );
}
