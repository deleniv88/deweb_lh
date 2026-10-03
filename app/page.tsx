import { HomePage, homeMetadata } from "../lib/homePage";

export const generateMetadata = () => homeMetadata("en");
export default function Page() { return <HomePage locale="en" />; }
