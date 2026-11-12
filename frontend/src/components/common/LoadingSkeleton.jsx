

/* ---------------------------------------
   Generic Skeleton
---------------------------------------- */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`bg-gray-700/50 rounded animate-pulse ${className}`}
    />
  );
}


/* ---------------------------------------
   Course List Skeleton
---------------------------------------- */

export function CourseListSkeleton() {
  return (
    <div className="space-y-4">

      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-6 animate-pulse"
        >
          <div className="flex justify-between items-center">

            <div className="space-y-3 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="flex gap-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>

          </div>
        </div>
      ))}

    </div>
  );
}


/* ---------------------------------------
   Batch List Skeleton
---------------------------------------- */

export function BatchListSkeleton() {
  return (
    <div className="space-y-4">

      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-6 animate-pulse"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">

            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>

            <Skeleton className="h-4 w-32" />

            <Skeleton className="h-4 w-28" />

            <Skeleton className="h-4 w-24" />

            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>

          </div>
        </div>
      ))}

    </div>
  );
}


/* ---------------------------------------
   Enrollment List Skeleton
---------------------------------------- */

export function EnrollmentListSkeleton() {
  return (
    <div className="bg-[#1A1F2B] border border-gray-800 rounded-2xl overflow-hidden animate-pulse">

      {/* Table Header */}

      <div className="grid grid-cols-6 gap-4 p-5 border-b border-gray-800">

        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />

      </div>


      {/* Rows */}

      {[1, 2, 3, 4, 5].map((item) => (

        <div
          key={item}
          className="grid grid-cols-6 gap-4 p-5 border-b border-gray-800"
        >

          <Skeleton className="h-4 w-28" />

          <Skeleton className="h-4 w-36" />

          <Skeleton className="h-4 w-32" />

          <Skeleton className="h-4 w-28" />

          <Skeleton className="h-6 w-20 rounded-full" />

          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>

        </div>

      ))}

    </div>
  );
}


/* ---------------------------------------
   Details Page Skeleton
---------------------------------------- */

export function DetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Skeleton className="h-10 w-24" />

      </div>


      {/* Main Card */}

      <div className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-8">

        <Skeleton className="h-7 w-64 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {[1, 2, 3, 4, 5, 6].map((item) => (

            <div key={item} className="space-y-2">

              <Skeleton className="h-4 w-24" />

              <Skeleton className="h-5 w-48" />

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}


/* ---------------------------------------
   Default Export
---------------------------------------- */

export default Skeleton;
