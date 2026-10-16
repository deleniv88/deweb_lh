import { LegalPage, legalMetadata } from "../../lib/legalPage";

export const generateMetadata = () => legalMetadata("terms", "pl");
export default function Page() { return <LegalPage kind="terms" locale="pl" />; }
