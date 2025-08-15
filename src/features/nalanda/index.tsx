import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Brain, TreePine, Sparkles } from 'lucide-react';

export default function NalandaPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Nalanda</h1>
          <TreePine className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The future of personalized learning journeys. Experience education the way it was meant to be.
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <CardDescription className="text-lg">
            Interactive Learning Tree • Adaptive Pathways • Personalized Journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              We're building something extraordinary. Nalanda will transform how you learn with:
            </p>
            
            <div className="grid gap-4 text-left">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>🌳 <strong>Tree of Life Learning Paths</strong> - Visual progress through interconnected knowledge</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>🎯 <strong>Adaptive AI Tutor</strong> - Personalized guidance that evolves with you</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>✨ <strong>Interactive Modules</strong> - Engage with content in revolutionary ways</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button disabled className="w-full" size="lg">
              <Brain className="h-5 w-5 mr-2" />
              Launch Preview (V2)
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Available in Quiz Beef V2.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
