import {
    Source_Code_Pro,
    Figtree,
    Comfortaa
} from "next/font/google";
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"] });
const comfortaa = Comfortaa({ subsets: ["latin"] });


// strict mode
export const strictMode = false;

import { ClerkProvider } from "@clerk/nextjs";
import MobileProvider from "@/providers/Mobile/MobileProvider";
import SidebarCollapsedProvider from "@/providers/SidebarCollapsed/SidebarCollapsedProvider";

export default function App ({ Component, pageProps }) {
    return (
        <ClerkProvider>
            <SidebarCollapsedProvider>
                <MobileProvider>
                    <main className={`${comfortaa.className} ${sourceCodePro.className} ${figtree.className}`}>
                        <Component {...pageProps} />
                    </main>
                </MobileProvider>
            </SidebarCollapsedProvider>
        </ClerkProvider>
    )
}