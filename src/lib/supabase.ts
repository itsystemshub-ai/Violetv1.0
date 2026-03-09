// Archivo deshabilitado temporalmente para evitar errores de inicialización
// La aplicación usa Dexie local en Cloud/Navegador

// Mock de Supabase para evitar errores
// Todas las operaciones retornan error indicando que Supabase está deshabilitado
const createSupabaseMock = () => {
  const mockError = { 
    message: 'Supabase está deshabilitado. La aplicación usa localStorage/SQLite local.',
    code: 'SUPABASE_DISABLED'
  };

  const mockResponse = {
    data: null,
    error: mockError,
    count: null,
    status: 503,
    statusText: 'Service Unavailable'
  };

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    upsert: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    containedBy: () => mockQuery,
    rangeGt: () => mockQuery,
    rangeGte: () => mockQuery,
    rangeLt: () => mockQuery,
    rangeLte: () => mockQuery,
    rangeAdjacent: () => mockQuery,
    overlaps: () => mockQuery,
    textSearch: () => mockQuery,
    match: () => mockQuery,
    not: () => mockQuery,
    or: () => mockQuery,
    filter: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    single: () => Promise.resolve(mockResponse),
    maybeSingle: () => Promise.resolve(mockResponse),
    then: (resolve: any) => Promise.resolve(mockResponse).then(resolve),
    catch: (reject: any) => Promise.resolve(mockResponse).catch(reject),
  };

  return {
    from: () => mockQuery,
    auth: {
      signIn: () => Promise.resolve(mockResponse),
      signUp: () => Promise.resolve(mockResponse),
      signOut: () => Promise.resolve(mockResponse),
      getSession: () => Promise.resolve(mockResponse),
      getUser: () => Promise.resolve(mockResponse),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockResponse),
        download: () => Promise.resolve(mockResponse),
        remove: () => Promise.resolve(mockResponse),
        list: () => Promise.resolve(mockResponse),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: () => Promise.resolve(mockResponse),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => Promise.resolve({ error: null }),
    }),
  };
};

export const supabase = createSupabaseMock() as any;

console.log('[Violet ERP] Supabase deshabilitado - Usando solo localStorage/SQLite');
