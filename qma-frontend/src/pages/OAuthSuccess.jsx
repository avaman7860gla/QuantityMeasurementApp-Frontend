import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function OAuthSuccess() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            login(token); // store token + set user
            navigate("/"); // go to dashboard
        }
        else {
            navigate("/login");
        }
    }, []);

    return <div>Logging in...</div>;
}