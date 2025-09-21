import Link from "next/link";
export default function Home() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Link href='/agent03'> <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg">
          Agent 03
        </button> </Link>
      </div>
    </>
  );
}
