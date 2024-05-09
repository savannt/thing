import { useRouter } from "next/router";

import { useEffect } from "react";

export default function index () {
    // redirect to '/'
    const router = useRouter();
    useEffect(() => {
        router.push('/');
    }, []);
}