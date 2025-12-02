import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', "routes/auth.tsx"),
    route('/upload', 'routes/upload.tsx'),
    route('/create', 'routes/create.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/resume/:id/preview', 'routes/resume-preview.tsx'),
    route('/jobs', 'routes/jobs.tsx'),
    route('/jobs/:id', 'routes/job.tsx'),
    route('/wipe', 'routes/wipe.tsx')
] satisfies RouteConfig;
