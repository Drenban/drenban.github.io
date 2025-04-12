import SupabaseClient from './SupabaseClient.js';
import { GoTrueClient } from './gotrue.js';
import { RealtimeClient } from './realtime.js';
import { StorageClient } from './storage.js';
import { FunctionsClient } from './functions.js';

export { PostgrestError } from './postgrest.js';
export { FunctionsHttpError, FunctionsFetchError, FunctionsRelayError, FunctionsError, FunctionRegion } from './functions.js';
export { default as SupabaseClient } from './SupabaseClient';
/**
 * Creates a new Supabase Client.
 */
export const createClient = (supabaseUrl, supabaseKey, options) => {
    return new SupabaseClient(supabaseUrl, supabaseKey, options);
};
//# sourceMappingURL=index.js.map
