import React, { useEffect, useRef, useState } from "react";
import { TURKEY_PROVINCES } from "../data/turkeyProvinces";
import { fetchDistrictsForProvince } from "../data/turkeyGeoApi";
import "./ProvinceDistrictFields.css";

/**
 * Linked province → district dropdowns (district list loaded from turkiyeapi.dev).
 */
function ProvinceDistrictFields({
  provinceId,
  districtId,
  onProvinceChange,
  onDistrictChange,
  selectClassName = "",
  errorProvince = false,
  errorDistrict = false,
  disabled = false,
  matchDistrictName = null,
  provinceLabel = "Province",
  districtLabel = "District",
  required = true
}) {
  const [districts, setDistricts] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtListFailed, setDistrictListFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const pendingDistrictNameRef = useRef(null);
  const onDistrictChangeRef = useRef(onDistrictChange);
  onDistrictChangeRef.current = onDistrictChange;

  useEffect(() => {
    if (matchDistrictName) {
      pendingDistrictNameRef.current = matchDistrictName;
    }
  }, [matchDistrictName]);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setDistrictLoading(false);
      setDistrictListFailed(false);
      return undefined;
    }

    let cancelled = false;
    setDistrictLoading(true);
    setDistrictListFailed(false);

    fetchDistrictsForProvince(Number(provinceId))
      .then((list) => {
        if (cancelled) {
          return;
        }
        const arr = Array.isArray(list) ? list : [];
        setDistricts(arr);
        const pending = pendingDistrictNameRef.current;
        if (pending) {
          const hit = arr.find((d) => d.name === pending);
          if (hit) {
            onDistrictChangeRef.current(String(hit.id));
          } else {
            onDistrictChangeRef.current("");
          }
          pendingDistrictNameRef.current = null;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDistricts([]);
          setDistrictListFailed(true);
          onDistrictChangeRef.current("");
          pendingDistrictNameRef.current = null;
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDistrictLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provinceId, retryNonce]);

  const selectCls = (err) =>
    [selectClassName, err ? "input-error province-district-error" : ""]
      .filter(Boolean)
      .join(" ");

  const reqMark = required ? (
    <span className="province-district-req" aria-hidden="true">
      {" "}
      *
    </span>
  ) : null;

  return (
    <div className="province-district-fields">
      <label className="province-district-label">
        <span className="province-district-label-heading">
          {provinceLabel}
          {reqMark}
        </span>
        <select
          className={selectCls(errorProvince)}
          value={provinceId}
          disabled={disabled}
          autoComplete="address-level1"
          onChange={(e) => {
            pendingDistrictNameRef.current = null;
            onProvinceChange(e.target.value);
            onDistrictChange("");
            setDistrictListFailed(false);
            setRetryNonce(0);
          }}
        >
          <option value="">Select a province</option>
          {TURKEY_PROVINCES.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="province-district-label">
        <span className="province-district-label-heading">
          {districtLabel}
          {reqMark}
        </span>
        <select
          className={selectCls(errorDistrict)}
          value={districtId}
          disabled={disabled || !provinceId || districtLoading || districtListFailed}
          autoComplete="address-level2"
          onChange={(e) => onDistrictChange(e.target.value)}
          aria-describedby={districtListFailed ? "province-district-retry-hint" : undefined}
        >
          <option value="">
            {!provinceId
              ? "Select a province first"
              : districtLoading
                ? "Loading districts…"
                : districtListFailed
                  ? "Could not load districts"
                  : "Select a district"}
          </option>
          {districts.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </select>
        {districtListFailed && provinceId && !disabled && (
          <button
            id="province-district-retry-hint"
            type="button"
            className="province-district-retry"
            onClick={() => setRetryNonce((n) => n + 1)}
          >
            Retry loading districts
          </button>
        )}
      </label>
    </div>
  );
}

export default ProvinceDistrictFields;
