import { AuditPage, auditMetadata } from "../../lib/auditPage";

export const generateMetadata = () => auditMetadata("pl");
export default function Page() { return <AuditPage locale="pl" />; }
