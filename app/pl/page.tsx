import { HomePage, homeMetadata } from "../../lib/homePage";

export const generateMetadata = () => homeMetadata("pl");
export default function Page() { return <HomePage locale="pl" />; }
