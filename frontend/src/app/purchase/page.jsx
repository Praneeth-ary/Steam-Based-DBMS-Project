import Link from "next/link";

export default function PurchaseHubPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-black text-white">Purchase flow</h1>
      <p className="mt-4 text-gray-400">
        Select a game in the store; the purchase UI lives on each{" "}
        <Link href="/" className="text-steam-accent hover:underline">
          game detail
        </Link>{" "}
        page so evaluators can watch PURCHASE → PAYMENT → USER_LIBRARY in DB mode.
      </p>
    </div>
  );
}
