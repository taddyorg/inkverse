export function NotFound({ message, subtitle }: { message: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">{message}</h1>
        {subtitle && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
