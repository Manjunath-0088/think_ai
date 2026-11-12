import type { RootStackParamList } from "@/navigation/types";

export type AccessAudience =
  | "admin"
  | "instructor"
  | "ta"
  | "staff"
  | "learner"
  | "account"
  | "moderation";
export const isAdministrator = (role?: string | null) =>
  ["admin", "superadmin"].includes((role || "").trim().toLowerCase());
const normalizedRole = (role?: string | null) => (role || "").trim().toLowerCase();
const isInstructor = (role?: string | null) => normalizedRole(role) === "instructor";
const isTeachingAssistant = (role?: string | null) => normalizedRole(role) === "ta";
const isStaff = (role?: string | null) =>
  isAdministrator(role) || isInstructor(role) || isTeachingAssistant(role);
export function allowsAudience(audience: AccessAudience, role?: string | null) {
  if (!role) return false;
  if (audience === "admin") return isAdministrator(role);
  if (audience === "instructor") return isInstructor(role) || isAdministrator(role);
  if (audience === "ta") return isTeachingAssistant(role) || isAdministrator(role);
  if (audience === "staff") return isStaff(role);
  if (audience === "learner") return normalizedRole(role) === "learner";
  if (audience === "moderation")
    return (
      isAdministrator(role) ||
      ["moderator", "administrator", "moderator:superuser"].includes(
        normalizedRole(role),
      )
    );
  return true;
}
export type WorkspaceRoute =
  | "AdminHome"
  | "StaffTools"
  | "LearnerDashboard"
  | "ForumHome"
  | "Account";
export const roleHome = (role?: string | null): WorkspaceRoute => {
  if (isAdministrator(role)) return "AdminHome";
  if (isInstructor(role) || isTeachingAssistant(role)) return "StaffTools";
  if (normalizedRole(role) === "learner") return "LearnerDashboard";
  if (normalizedRole(role) === "moderator") return "ForumHome";
  return "Account";
};
export const routeAudience: Partial<
  Record<keyof RootStackParamList, AccessAudience>
> = {
  AdminHome: "admin",
  Analytics: "admin",
  Account: "account",
  StaffTools: "staff",
  LiveStudio: "account",
  AttendanceRegister: "staff",
  AttendanceReport: "staff",
  GradingQueue: "staff",
  InstructorControls: "staff",
  RbacMatrix: "admin",
  LmsHome: "learner",
  CoursePlayer: "learner",
  AssessmentTaking: "learner",
  AssessmentResults: "learner",
  LmsCertificate: "learner",
  Certificate: "learner",
  VideoPlayer: "learner",
  Assessment: "learner",
  Results: "learner",
  PaymentSuccess: "learner",
  PaymentFailed: "learner",
  NotificationPreferences: "account",
  Downloads: "learner",
  CodePlayground: "learner",
  PlaygroundHistory: "learner",
  LearnerProfile: "learner",
  LmsSettings: "learner",
  LearnerDashboard: "learner",
  MyLearning: "learner",
  MyCourses: "learner",
  CourseDetail: "learner",
  Wishlist: "learner",
  Profile: "learner",
  Checkout: "learner",
  GlobalSearch: "account",
  ForumHome: "account",
  ForumCategories: "account",
  ForumNotifications: "account",
  ForumThread: "account",
  CreatePost: "account",
  Bookmarks: "account",
  Moderation: "moderation",
};
