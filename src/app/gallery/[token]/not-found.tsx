export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Gallery Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The gallery you are looking for does not exist or may have expired.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">
              Possible reasons:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• The gallery link is incorrect or incomplete</li>
              <li>• The gallery has expired</li>
              <li>• The gallery has been removed by the photographer</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Please check your link or contact your photographer for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
