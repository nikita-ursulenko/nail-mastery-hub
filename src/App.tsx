import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ProtectedUserRoute } from "@/components/user/ProtectedUserRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SEOUpdater } from "@/components/SEOUpdater";

// Lazy load pages для code splitting
const Index = lazy(() => import("./pages/Index"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardCourses = lazy(() => import("./pages/DashboardCourses"));
const DashboardCourseDetail = lazy(() => import("./pages/DashboardCourseDetail"));
const DashboardLesson = lazy(() => import("./pages/DashboardLesson"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Contacts = lazy(() => import("./pages/Contacts"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Login = lazy(() => import("./pages/Login"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminFounder = lazy(() => import("./pages/admin/Founder"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminSEO = lazy(() => import("./pages/admin/SEO"));
const AdminCourses = lazy(() => import("./pages/admin/Courses"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <SEOUpdater />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              
              {/* User routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedUserRoute>
                    <Dashboard />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/dashboard/courses"
                element={
                  <ProtectedUserRoute>
                    <DashboardCourses />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/dashboard/courses/:id"
                element={
                  <ProtectedUserRoute>
                    <DashboardCourseDetail />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/dashboard/courses/:courseId/lessons/:lessonId"
                element={
                  <ProtectedUserRoute>
                    <DashboardLesson />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <ProtectedUserRoute>
                    <DashboardSettings />
                  </ProtectedUserRoute>
                }
              />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/testimonials"
                element={
                  <ProtectedRoute>
                    <AdminTestimonials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contacts"
                element={
                  <ProtectedRoute>
                    <AdminContacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/founder"
                element={
                  <ProtectedRoute>
                    <AdminFounder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/team"
                element={
                  <ProtectedRoute>
                    <AdminTeam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/blog"
                element={
                  <ProtectedRoute>
                    <AdminBlog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/seo"
                element={
                  <ProtectedRoute>
                    <AdminSEO />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </UserAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
