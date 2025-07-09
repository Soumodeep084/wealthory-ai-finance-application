import HeroSection from "@/components/hero";
import { Card, CardContent } from "@/components/ui/card";
import { statsData , featuresData , howItWorksData } from "@/data/Home_data";

export default function LandingPage() {
  return (
    
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <HeroSection />
      
      {/* Stats Section */}
      <section id="stats" className="py-10 bg-blue-50 m-5 font-arial">
        <div className="mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Here our Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {statsData.map((stat, index) => (
              <Card key={index} className="text-center p-4 hover:bg-gray-100">
                <div className="text-xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm md:text-xl">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-12 m-5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <Card className="p-6" key={index}>
                <CardContent className="space-y-4 pt-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 m-5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center bg-blue-50 p-8 border rounded-2xl">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
