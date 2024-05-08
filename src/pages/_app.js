import {
    Source_Code_Pro,
    Figtree,
    Comfortaa
} from "next/font/google";
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"] });
const comfortaa = Comfortaa({ subsets: ["latin"] });



export default function App ({ Component, pageProps }) {
    return (
        <main className={`${comfortaa.className} ${sourceCodePro.className} ${figtree.className}`}>
            <Component {...pageProps} />
        </main>
    )
}