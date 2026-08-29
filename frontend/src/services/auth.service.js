const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// =====================================================
// LOGIN
// =====================================================

export const loginUser = async ({
    email,
    password,
}) => {

    const response =
        await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );


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

        data =
            await response.json();

    } else {

        const text =
            await response.text();

        throw new Error(
            text ||
            `Server returned HTTP ${response.status}`
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            `Login failed with status ${response.status}`
        );
    }


    return data;
};


// =====================================================
// LOGOUT
// =====================================================

export const logoutUser = () => {

    localStorage.removeItem(
        "hms_token"
    );

    localStorage.removeItem(
        "hms_user"
    );
};