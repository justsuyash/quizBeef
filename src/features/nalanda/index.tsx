import React from 'react';
import { Button } from '../../components/ui/button';
import { BrainCircuit, BookOpen, Zap, ShieldCheck, Target, Award, GitMerge } from 'lucide-react';

// Main component for the Nalanda showcase page
export default function NalandaPage() {
  return (
    <div className="bg-[#FAF6F0] text-[#3E2723] font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1A237E]">
            Welcome to Nalanda
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[#3E2723]/80 max-w-3xl mx-auto">
            A revolutionary AI-powered learning experience that adapts to you, inspired by ancient wisdom and modern science.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" className="bg-[#B7410E] hover:bg-[#93340c] text-white shadow-lg transform hover:scale-105 transition-transform">
              Request a Demo
            </Button>
            <Button size="lg" variant="outline" className="border-[#B7410E] text-[#B7410E] hover:bg-[#B7410E]/10 transform hover:scale-105 transition-transform">
              Learn More
            </Button>
          </div>
        </header>

        {/* Core Capabilities Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1A237E]">What Makes Nalanda Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GitMerge className="h-10 w-10" />}
              iconBgColor="bg-[#689F38]/20 text-[#689F38]"
              title="The Tree of Life"
              description="Your knowledge visualized as a living tree. It grows as you learn, revealing your path from foundational roots to expert mastery and helping you identify new areas to explore."
            />
            <FeatureCard
              icon={<BrainCircuit className="h-10 w-10" />}
              iconBgColor="bg-[#0288D1]/20 text-[#0288D1]"
              title="The AI Guide (Ganesha)"
              description="Your gentle teacher. The AI provides personalized hints, examples, and encouragement, preventing frustration and keeping you in a state of flow."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10" />}
              iconBgColor="bg-[#FF9933]/20 text-[#FF9933]"
              title="Peak Performance Engine"
              description="Learn smarter, not harder. Integrated tools like the Pomodoro timer and optimal learning time suggestions help prevent burnout and maximize retention."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-10 w-10" />}
              iconBgColor="bg-[#C62828]/20 text-[#C62828]"
              title="Science-Backed Methods"
              description="Built on proven principles like Active Recall and Spaced Repetition to ensure long-term memory formation."
            />
            <FeatureCard
              icon={<Target className="h-10 w-10" />}
              iconBgColor="bg-[#1A237E]/20 text-[#1A237E]"
              title="Teach-Back & Interleaving"
              description="Go beyond memorization. Solidify your understanding by teaching concepts back to the AI and tackling mixed-topic challenges."
            />
            <FeatureCard
              icon={<Award className="h-10 w-10" />}
              iconBgColor="bg-[#D4AF37]/20 text-[#D4AF37]"
              title="From Concepts to Mastery"
              description="A complete journey from understanding individual concepts to applying them in complex, real-world scenarios."
            />
          </div>
        </section>

      </div>
    </div>
  );
}

// A reusable component for feature cards
function FeatureCard({ icon, title, description, iconBgColor }: { icon: React.ReactNode; title: string; description: string; iconBgColor: string; }) {
  return (
    <div className="bg-white/50 dark:bg-gray-800/20 p-6 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-black/5">
      <div className={`flex items-center justify-center h-16 w-16 rounded-full ${iconBgColor} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-[#1A237E]">{title}</h3>
      <p className="text-[#3E2723]/80">{description}</p>
    </div>
  );
}
