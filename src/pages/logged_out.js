import { useRouter } from "next/router";

import { useEffect } from "react";

export default function logged_out () {
    const router = useRouter();
    useEffect(() => {
        router.push("/");
    }, []);
}