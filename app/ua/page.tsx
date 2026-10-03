import { HomePage, homeMetadata } from "../../lib/homePage";

export const generateMetadata = () => homeMetadata("ua");
export default function Page() { return <HomePage locale="ua" />; }
