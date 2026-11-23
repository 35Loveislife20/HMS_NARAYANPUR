const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


/* =========================================================
   LOGIN USER
========================================================= */

export const loginUser = async ({
    email,
    password,
    role = null,
    hospitalId = null,
    hospital_id = null,
}) => {
    const normalizedEmail =
        String(email || "")
            .trim()
            .toLowerCase();


    /*
     * Keep both hospitalId and hospital_id because
     * different HMS backend code may use either name.
     */

    const finalHospitalId =
        hospitalId !== undefined
            ? hospitalId
            : hospital_id !== undefined
                ? hospital_id
                : null;


    const payload = {
        email:
            normalizedEmail,

        password,

        role:
            role || null,

        hospitalId:
            finalHospitalId,

        hospital_id:
            finalHospitalId,
    };


    let response;


    /* =====================================================
       SEND REQUEST
    ===================================================== */

    try {
        response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Accept:
                        "application/json",
                },

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );
    } catch (error) {
        console.error(
            "HMS login network error:",
            error
        );

        throw new Error(
            "Unable to connect to HMS server. Please make sure the backend is running on port 5000."
        );
    }


    /* =====================================================
       READ RESPONSE
    ===================================================== */

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data;


    if (
        contentType.includes(
            "application/json"
        )
    ) {
        try {
            data =
                await response.json();
        } catch (error) {
            throw new Error(
                `Server returned invalid JSON. HTTP ${response.status}`
            );
        }
    } else {
        const text =
            await response.text();


        throw new Error(
            text ||
            `Server returned HTTP ${response.status}`
        );
    }


    /* =====================================================
       HANDLE HTTP ERROR
    ===================================================== */

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            `Login failed with status ${response.status}`
        );
    }


    /* =====================================================
       HANDLE EMPTY RESPONSE
    ===================================================== */

    if (!data) {
        throw new Error(
            "Empty response received from HMS server."
        );
    }


    /* =====================================================
       RETURN API RESPONSE
    ===================================================== */

    return data;
};


/* =========================================================
   LOGOUT USER
========================================================= */

export const logoutUser = () => {
    /*
     * Main HMS authentication keys
     */

    localStorage.removeItem(
        "hms_token"
    );

    localStorage.removeItem(
        "hms_user"
    );


    /*
     * Older/compatibility keys
     */

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "authToken"
    );

    localStorage.removeItem(
        "user"
    );

    localStorage.removeItem(
        "role"
    );

    localStorage.removeItem(
        "hms_role"
    );


    /*
     * Hospital selection
     */

    localStorage.removeItem(
        "hms_hospital_id"
    );

    localStorage.removeItem(
        "hms_hospital_name"
    );
};


/* =========================================================
   GET AUTH TOKEN
========================================================= */

export const getAuthToken = () => {
    return (
        localStorage.getItem(
            "hms_token"
        ) ||

        localStorage.getItem(
            "token"
        ) ||

        localStorage.getItem(
            "authToken"
        ) ||

        null
    );
};


/* =========================================================
   GET STORED USER
========================================================= */

export const getStoredUser = () => {
    const storedUser =
        localStorage.getItem(
            "hms_user"
        ) ||
        localStorage.getItem(
            "user"
        );


    if (!storedUser) {
        return null;
    }


    try {
        return JSON.parse(
            storedUser
        );
    } catch (error) {
        console.error(
            "Unable to parse stored HMS user:",
            error
        );

        return null;
    }
};


/* =========================================================
   CHECK AUTH TOKEN
========================================================= */

export const hasAuthToken = () => {
    return Boolean(
        getAuthToken()
    );
};