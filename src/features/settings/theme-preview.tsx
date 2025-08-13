import React from 'react';
import { colorThemes } from '../../config/color-themes';
import { cn } from '../../lib/cn';
import { Gamepad2, Trophy, BookOpen, Zap } from 'lucide-react';

export default function ThemePreviewPage() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Quiz Beef Color Theme Options</h1>
        <p className="text-muted-foreground">
          Choose a color scheme that best represents your competitive spirit!
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(colorThemes).map(([key, theme]) => (
          <div key={key} className="space-y-4">
            {/* Theme Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{theme.name}</h2>
                <p className="text-muted-foreground">{theme.description}</p>
              </div>
              <div className="flex gap-2">
                {/* Color Swatches */}
                <div className="flex items-center gap-1">
                  <div 
                    className="w-10 h-10 rounded-lg shadow-md" 
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg shadow-md" 
                    style={{ backgroundColor: theme.colors.secondary }}
                    title="Secondary"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg shadow-md" 
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div 
              className="rounded-xl p-6 shadow-lg"
              style={{ 
                backgroundColor: theme.colors.background,
                color: theme.colors.foreground,
                border: `2px solid ${theme.colors.primary}20`
              }}
            >
              {/* Mock Play Screen */}
              <div className="text-center mb-6">
                <h3 
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Ready to Beef?
                </h3>
                <p style={{ opacity: 0.7 }}>
                  Challenge yourself, compete with friends
                </p>
              </div>

              {/* Play Button */}
              <div className="flex justify-center mb-8">
                <button
                  className="px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transform transition-transform hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.background,
                    boxShadow: `0 0 30px ${theme.colors.primary}40`
                  }}
                >
                  <Gamepad2 className="w-6 h-6" />
                  PLAY NOW
                </button>
              </div>

              {/* Game Mode Cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, title: 'Classic Quiz', color: theme.colors.primary },
                  { icon: Zap, title: 'Rapid Fire', color: theme.colors.accent },
                  { icon: Trophy, title: 'Tournament', color: theme.colors.secondary },
                  { icon: Gamepad2, title: 'Practice', color: theme.colors.primary },
                ].map((mode, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: `${mode.color}10`,
                      border: `1px solid ${mode.color}30`
                    }}
                  >
                    <mode.icon 
                      className="w-8 h-8 mb-2" 
                      style={{ color: mode.color }}
                    />
                    <p className="font-medium">{mode.title}</p>
                  </div>
                ))}
              </div>

              {/* Navigation Preview */}
              <div className="flex justify-around mt-6 pt-4 border-t" style={{ borderColor: `${theme.colors.foreground}20` }}>
                {['Play', 'Library', 'Compete', 'Profile'].map((item, idx) => (
                  <div 
                    key={item}
                    className="text-center"
                    style={{ 
                      color: idx === 0 ? theme.colors.primary : `${theme.colors.foreground}60`
                    }}
                  >
                    <div className="w-6 h-6 mx-auto mb-1 rounded" 
                      style={{ 
                        backgroundColor: idx === 0 ? theme.colors.primary : 'transparent',
                        opacity: idx === 0 ? 0.2 : 1
                      }}
                    />
                    <span className="text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Nalanda Scholar Message */}
            {key === 'nalandaScholar' && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Cultural Heritage:</strong> Nalanda University (427-1197 CE) in Bihar, India was one of the world's 
                  first universities and a major center of Buddhist learning. This theme honors that legacy with colors 
                  inspired by its terracotta architecture, Buddhist traditions, and ancient manuscripts.
                </p>
              </div>
            )}

            {/* Theme Details */}
            <div className="grid grid-cols-5 gap-4 text-sm mt-4">
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 shadow-inner" 
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <p className="font-medium">Primary</p>
                <p className="text-xs opacity-60">{theme.colors.primary}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 shadow-inner" 
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <p className="font-medium">Secondary</p>
                <p className="text-xs opacity-60">{theme.colors.secondary}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 shadow-inner" 
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <p className="font-medium">Accent</p>
                <p className="text-xs opacity-60">{theme.colors.accent}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 shadow-inner border-2" 
                  style={{ 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.foreground + '20'
                  }}
                />
                <p className="font-medium">Background</p>
                <p className="text-xs opacity-60">{theme.colors.background}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 shadow-inner" 
                  style={{ backgroundColor: theme.colors.foreground }}
                />
                <p className="font-medium">Text</p>
                <p className="text-xs opacity-60">{theme.colors.foreground}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Implementation Note */}
      <div className="mt-12 p-6 bg-muted/50 rounded-xl">
        <h3 className="font-bold mb-2">Implementation Notes:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Each theme includes both light and dark mode variations</li>
          <li>• Colors are optimized for accessibility (WCAG AA compliance)</li>
          <li>• Gradients and effects enhance the competitive gaming feel</li>
          <li>• All themes work seamlessly with the existing Tailwind setup</li>
        </ul>
      </div>
    </div>
  );
}
