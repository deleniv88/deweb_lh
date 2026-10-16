import { AuditPage, auditMetadata } from "../../../lib/auditPage";

export const generateMetadata = () => auditMetadata("ua");
export default function Page() { return <AuditPage locale="ua" />; }
