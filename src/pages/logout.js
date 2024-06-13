import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";

import { useEffect } from "react";

export default function logout () {
    const { signOut } = useClerk();
    const router = useRouter();
    useEffect(() => {
        signOut(() => router.push("/logged_out"));
    }, []);
}