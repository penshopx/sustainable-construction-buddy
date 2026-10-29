import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes';
import { Route, Switch, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell, Brand } from '@/components/app-shell';
import NotFound from '@/pages/not-found';
import LandingPage from '@/pages/landing';
import PortalPage from '@/pages/portal';
import ProfilePage from '@/pages/profile';
import AssistantsPage from '@/pages/assistants';
import ActivityPage from '@/pages/activity';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#3fb0ff',
    colorForeground: '#f3f7fc',
    colorMutedForeground: '#b4c2d6',
    colorDanger: '#f05252',
    colorBackground: '#0f1520',
    colorInput: '#151d2b',
    colorInputForeground: '#f3f7fc',
    colorNeutral: '#c9d6e8',
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#0f1520] border border-[#24314a] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f3f7fc] text-2xl font-extrabold',
    headerSubtitle: 'text-[#b4c2d6]',
    socialButtonsBlockButtonText: 'text-[#f3f7fc] font-semibold',
    formFieldLabel: 'text-[#e3ebf6] font-semibold',
    footerActionLink: 'text-[#3fb0ff] font-bold',
    footerActionText: 'text-[#b4c2d6]',
    dividerText: 'text-[#b4c2d6]',
    identityPreviewEditButton: 'text-[#3fb0ff]',
    formFieldSuccessText: 'text-[#7dd3a8]',
    alertText: 'text-[#f3f7fc]',
    logoBox: 'h-12 justify-center',
    logoImage: 'h-12 w-12',
    socialButtonsBlockButton: 'bg-[#151d2b] border border-[#2c3a55] hover:bg-[#1b2537]',
    formButtonPrimary: 'bg-[#3fb0ff] text-[#07101d] font-bold hover:bg-[#62c0ff]',
    formFieldInput: 'bg-[#151d2b] border border-[#2c3a55] text-[#f3f7fc]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#24314a]',
    alert: 'bg-[#1b2537] border border-[#2c3a55]',
    otpCodeFieldInput: 'bg-[#151d2b] border border-[#2c3a55] text-[#f3f7fc]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function AuthFrame({ children, side }: { children: ReactNode; side: string }) {
  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden lg:flex flex-col justify-between bg-ice p-12">
        <Brand />
        <div>
          <p className="text-5xl font-extrabold leading-[1] tracking-tight">{side}</p>
          <p className="mt-4 text-lg opacity-80 max-w-md">Dokumen badan usaha yang bisa dicari isinya dan ditanyakan, dengan kutipan sumber.</p>
        </div>
        <p className="font-mono-ui text-xs opacity-60">15 MB gratis · privat secara bawaan</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10 grid-lines">{children}</div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthFrame side="Kembali ke memori bisnis Anda.">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthFrame>
  );
}

function SignUpPage() {
  return (
    <AuthFrame side="Simpan sekali. Temukan kapan saja.">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthFrame>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/user-portal" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function protectedPage(Page: ComponentType) {
  return function Protected() {
    return (
      <>
        <Show when="signed-in">
          <AppShell>
            <RoutedErrorBoundary>
              <Page />
            </RoutedErrorBoundary>
          </AppShell>
        </Show>
        <Show when="signed-out">
          <Redirect to="/" />
        </Show>
      </>
    );
  };
}

const PortalRoute = protectedPage(PortalPage);
const ProfileRoute = protectedPage(ProfilePage);
const AssistantsRoute = protectedPage(AssistantsPage);
const ActivityRoute = protectedPage(ActivityPage);

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Masuk ke Ruang Simpan', subtitle: 'Lanjutkan ke dokumen perusahaan Anda' } },
        signUp: { start: { title: 'Buat ruang kerja', subtitle: '15 MB gratis, privat secara bawaan' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/user-portal" component={PortalRoute} />
            <Route path="/profile" component={ProfileRoute} />
            <Route path="/assistants" component={AssistantsRoute} />
            <Route path="/activity" component={ActivityRoute} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
