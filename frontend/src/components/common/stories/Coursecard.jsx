import PropTypes from 'prop-types';
import Button from './Button';

const LEVEL_STYLES = {
  Beginner: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  Intermediate: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Advanced: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
};

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12.8 12.2c1.7.2 3 1.5 3.5 3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.6l-4.7 2.35.9-5.23-3.8-3.7 5.25-.76z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * CourseCard — catalog/dashboard card for an online course.
 * Shows an "Enroll" CTA by default; pass `progress` to switch into an
 * in-progress state with a progress bar and "Continue learning" CTA.
 */
function CourseCard({
  title,
  instructor,
  thumbnail,
  level = 'Beginner',
  duration,
  lessons,
  rating,
  studentsCount,
  price,
  progress,
  onEnroll,
}) {
  const isEnrolled = typeof progress === 'number';
  const levelClass = LEVEL_STYLES[level] || LEVEL_STYLES.Beginner;

  return (
    <div
      className="group w-full max-w-sm overflow-hidden rounded-xl border border-white/10
                 bg-slate-900/60 backdrop-blur-sm transition-all duration-300
                 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
    >
      {/* thumbnail */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-indigo-600/40 to-cyan-500/30">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl font-black tracking-tight text-white/20">
              {title?.slice(0, 1) ?? '?'}
            </span>
          </div>
        )}

        <div
          className="absolute inset-0 flex items-center justify-center bg-black/0
                     transition-colors duration-300 group-hover:bg-black/30"
        >
          <div
            className="flex h-11 w-11 scale-90 items-center justify-center rounded-full
                       bg-white/90 text-slate-900 opacity-0 shadow-lg transition-all duration-300
                       group-hover:scale-100 group-hover:opacity-100"
          >
            <PlayIcon />
          </div>
        </div>

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold
                      ring-1 ring-inset ${levelClass}`}
        >
          {level}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white">
            {title}
          </h3>
          {instructor && (
            <p className="mt-1 text-sm text-slate-400">by {instructor}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
          {duration && (
            <span className="flex items-center gap-1">
              <ClockIcon />
              {duration}
            </span>
          )}
          {typeof lessons === 'number' && (
            <span>{lessons} lessons</span>
          )}
          {typeof studentsCount === 'number' && (
            <span className="flex items-center gap-1">
              <UsersIcon />
              {studentsCount.toLocaleString()}
            </span>
          )}
          {typeof rating === 'number' && (
            <span className="flex items-center gap-1 text-amber-300">
              <StarIcon />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {isEnrolled && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-3">
          {!isEnrolled && (
            <span className="text-sm font-bold text-white">
              {price ? price : 'Free'}
            </span>
          )}
          <div className={isEnrolled ? 'w-full' : 'ml-auto w-auto min-w-[9.5rem]'}>
            <Button
              label={isEnrolled ? 'Continue learning' : 'Enroll now'}
              onClick={onEnroll}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

CourseCard.propTypes = {
  title: PropTypes.string.isRequired,
  instructor: PropTypes.string,
  thumbnail: PropTypes.string,
  level: PropTypes.oneOf(['Beginner', 'Intermediate', 'Advanced']),
  duration: PropTypes.string,
  lessons: PropTypes.number,
  rating: PropTypes.number,
  studentsCount: PropTypes.number,
  price: PropTypes.string,
  progress: PropTypes.number,
  onEnroll: PropTypes.func,
};

export default CourseCard;