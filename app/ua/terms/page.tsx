import { LegalPage, legalMetadata } from "../../../lib/legalPage";

export const generateMetadata = () => legalMetadata("terms", "ua");
export default function Page() { return <LegalPage kind="terms" locale="ua" />; }
