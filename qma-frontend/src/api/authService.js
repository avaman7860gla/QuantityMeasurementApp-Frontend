import API from "./axios";

// Register
export const registerUser = async (data) => {
    try {
        const res = await API.post("/auth/register", data);
        return res.data;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
};

// Login
export const loginUser = async (data) => {
    try {
        const res = await API.post("/auth/login", data);

        //  Backend returns token directly
        const token = res.data;

        // Store JWT
        localStorage.setItem("token", token);

        return token;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
};