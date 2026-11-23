import { Country, State, City } from "country-state-city";
import { INDIA_DISTRICTS } from "./Indiadistricts";

/* Country list (name + ISO code), A-Z */
export const COUNTRY_LIST = Country.getAllCountries()
    .map((country) => ({
        name: country.name,
        code: country.isoCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY = "India";

export const getCountryCode = (countryName) => {
    const found = COUNTRY_LIST.find((country) => country.name === countryName);
    return found ? found.code : "";
};

/* States of a country (names) */
export const getStateList = (countryName) => {
    const code = getCountryCode(countryName);

    if (!code) return [];

    return State.getStatesOfCountry(code)
        .map((state) => state.name)
        .sort((a, b) => a.localeCompare(b));
};

/*
   Districts of a state.
   India  -> real district list
   Others -> cities of that state (country-state-city has no districts)
*/
export const getDistrictList = (countryName, stateName) => {
    const code = getCountryCode(countryName);

    if (!code || !stateName) return [];

    if (code === "IN") {
        return INDIA_DISTRICTS[stateName] || [];
    }

    const state = State.getStatesOfCountry(code).find(
        (item) => item.name === stateName
    );

    if (!state) return [];

    return [
        ...new Set(
            City.getCitiesOfState(code, state.isoCode).map(
                (city) => city.name
            )
        ),
    ].sort((a, b) => a.localeCompare(b));
};