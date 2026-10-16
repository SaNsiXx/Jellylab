import { getTranslations } from "next-intl/server";
import { legalEntity, isPlaceholder } from "@/lib/legal/entity";
import { TrackedLink } from "@/components/ui/TrackedLink";

function Pending({ value }: { value: string }) {
  return <span className="rounded-md border border-dashed border-orange/50 px-1.5 py-0.5 font-mono text-xs text-orange">{value}</span>;
}

/** Email + LinkedIn from lib/legal/entity.ts (placeholders until the real data is supplied). */
export async function ContactDetails() {
  const t = await getTranslations("contactPage");
  const tAlly = await getTranslations("a11y");
  const { contactEmail, linkedinUrl } = legalEntity;
  return (
    <dl className="mt-6 grid gap-5">
      <div>
        <dt className="text-sm text-muted">{t("email")}</dt>
        <dd className="mt-1">
          {isPlaceholder(contactEmail) ? (
            <Pending value={contactEmail} />
          ) : (
            <TrackedLink plain href={`mailto:${contactEmail}`} event="contact_click" eventProps={{ method: "email" }} className="text-lg hover:text-cyan">
              {contactEmail}
            </TrackedLink>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-sm text-muted">{t("linkedin")}</dt>
        <dd className="mt-1">
          {isPlaceholder(linkedinUrl) ? (
            <Pending value={linkedinUrl} />
          ) : (
            <TrackedLink plain href={linkedinUrl} target="_blank" rel="noopener noreferrer" event="contact_click" eventProps={{ method: "linkedin" }} className="text-lg hover:text-cyan">
              LinkedIn <span className="sr-only">{tAlly("external")}</span>
            </TrackedLink>
          )}
        </dd>
      </div>
    </dl>
  );
}
