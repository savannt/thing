import billing from "@/client/billing";

import { useEffect } from "react";

export default function stripe () {
    useEffect(() => {
        billing().then(({ url }) => {
            if(url) {
                // redirect
                window.location.href = url;
            }
        })
    }, []);
    return null;
}