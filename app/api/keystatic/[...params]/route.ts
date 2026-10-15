import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../keystatic.config";
import { keystaticEnabled } from "@/lib/cms/keystatic-enabled";

const handler = makeRouteHandler({ config });
const disabled = () => new Response("Not found", { status: 404 });

export const GET = keystaticEnabled ? handler.GET : disabled;
export const POST = keystaticEnabled ? handler.POST : disabled;
