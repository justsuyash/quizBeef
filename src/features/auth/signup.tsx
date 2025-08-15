import { SignupForm, useAuth } from 'wasp/client/auth';
import { Link } from 'wasp/client/router';
import { useAction } from 'wasp/client/operations';
import { updateProfileLocation } from 'wasp/client/operations';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '../../components/ui/command';
import { MapPin } from 'lucide-react';
import { useTheme } from '../../hooks/use-theme';

export function Signup() {
  const { colors } = useTheme();
  const { data: authUser } = useAuth();

  // Lightweight reuse of Settings location search for post‑signup capture
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ display_name: string }[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const updateLocation = useAction(updateProfileLocation);

  const searchLocations = async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({ q, format: 'json', addressdetails: '1', limit: '8', 'accept-language': 'en' }),
        { headers: { 'User-Agent': 'QuizBeef-App/1.0 (https://quizbeef.com)' } }
      );
      const data = await res.json();
      setSuggestions(data.map((d: any) => ({ display_name: d.display_name })));
      setShowSuggestions(true);
    } catch { setSuggestions([]); setShowSuggestions(false); }
    finally { setLoading(false); }
  };

  const debouncedSearch = (q: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => searchLocations(q), 300);
    setSearchTimeout(t);
  };

  useEffect(() => () => { if (searchTimeout) clearTimeout(searchTimeout); }, [searchTimeout]);

  const handleSaveLocation = async () => {
    if (!city || !country) return;
    try { await updateLocation({ city, country }); setShowSuggestions(false); }
    catch (e) { console.error('Failed to save location', e); }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-primary-foreground'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Enter your information to create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm
            appearance={{
              colors,
            }}
          />

          {/* Post-signup quick location capture using Nominatim */}
          {authUser && (
            <div className='mt-6 space-y-4'>
              <h3 className='text-sm font-semibold'>Where are you based?</h3>
              <div className='grid grid-cols-1 gap-3'>
                <div>
                  <Label htmlFor='country'>Country</Label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input id='country' className='pl-10' value={country}
                      placeholder='Type country (e.g., United States)'
                      onChange={(e) => { setCountry(e.target.value); debouncedSearch(e.target.value); }}
                      onFocus={(e) => { if (e.target.value.length >= 2) debouncedSearch(e.target.value); }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='city'>City</Label>
                  <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <div className='relative'>
                        <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                        <Input id='city' className='pl-10' value={city}
                          placeholder='Type city (e.g., San Francisco)'
                          onChange={(e) => { setCity(e.target.value); debouncedSearch(e.target.value); }}
                          onFocus={(e) => { if (e.target.value.length >= 2) debouncedSearch(e.target.value); }}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0'>
                      <Command>
                        <CommandList>
                          {loading ? (
                            <div className='p-3 text-sm text-muted-foreground'>Searching…</div>
                          ) : suggestions.length === 0 ? (
                            <CommandEmpty>No suggestions</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {suggestions.map((s, i) => (
                                <CommandItem key={i} value={s.display_name} onSelect={() => { setCity(s.display_name); setShowSuggestions(false); }}>
                                  <MapPin className='mr-2 h-4 w-4 text-muted-foreground' />
                                  {s.display_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button onClick={handleSaveLocation} disabled={!city || !country}>Save location</Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
