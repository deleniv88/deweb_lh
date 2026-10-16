import { AuditPage, auditMetadata } from "../../../lib/auditPage";

export const generateMetadata = () => auditMetadata("en");
export default function Page() { return <AuditPage locale="en" />; }
