import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Camera, Cake, Gift, Sparkles, ArrowRight, CheckCircle, Image, Palette, Heart, Brush, MessageSquare } from 'lucide-react';

export default function CustomizedCakesPage() {

  const features = [
    {
      icon: Image,
      title: "Photo Perfect",
      description: "Upload your favorite photos and we'll create edible prints with stunning clarity",
      bgGradient: "from-blue-500 to-purple-500"
    },
    {
      icon: Palette,
      title: "Custom Flavors",
      description: "Choose from 20+ premium flavors or create your own unique combination",
      bgGradient: "from-green-500 to-teal-500"
    },
    {
      icon: MessageSquare,
      title: "Personal Touch",
      description: "Add custom messages, names, and special decorative elements",
      bgGradient: "from-purple-500 to-indigo-500"
    },
    {
      icon: Brush,
      title: "Artistic Design",
      description: "Our expert bakers bring your imagination to life with artistic precision",
      bgGradient: "from-orange-500 to-red-500"
    }
  ];

  const process = [
    {
      step: 1,
      title: "Share Your Vision",
      description: "Tell us your ideas, upload photos, or describe your dream cake design"
    },
    {
      step: 2,
      title: "Expert Consultation",
      description: "Our cake artists will discuss details and provide design recommendations"
    },
    {
      step: 3,
      title: "Handcrafted Creation",
      description: "Watch your vision come to life with premium ingredients and artistic skill"
    },
    {
      step: 4,
      title: "Perfect Delivery",
      description: "Fresh, beautiful cake delivered safely to your doorstep in Gurgaon"
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-100 via-purple-50 to-orange-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Crafted with Care, <span className="text-pink-600">Inspired by You</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Celebrate your special moments with custom-designed cakes, made just the way you imagined.
            </p>
            
            {/* Illustration */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="w-80 h-60 bg-gradient-to-br from-orange-200 to-pink-200 rounded-3xl flex items-center justify-center shadow-lg">
                  <div className="text-6xl">🧑‍🍳</div>
                  <div className="absolute -top-4 -right-4 text-4xl animate-bounce">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse">🎂</div>
                </div>
              </div>
            </div>

            <Button 
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => window.open('https://wa.me/918287177303', '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with us on WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-orange-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Customized Cakes?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every celebration deserves a unique centerpiece. Here's what makes our custom cakes special.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>



      {/* How It Works */}
      <div className="py-20 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From imagination to reality in just 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <Card key={step.step} className="text-center p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  {index < process.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-pink-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Cake, Your Way – Customised Cakes Delivered Across Gurgaon
              </h2>
            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Design Your Perfect Cake with CakesBuy – Now in Gurgaon</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                At CakesBuy, we turn your sweet ideas into delicious realities. Whether it's a birthday surprise, an anniversary delight, or a theme party, our customised cakes are created to match your exact vision. Choose your flavours, fillings, and design down to the tiniest detail — and watch your imagination come to life. With our easy-to-use platform, ordering a custom cake online in Gurgaon is seamless and satisfying. Each cake is more than dessert — it's your story, baked and beautifully told.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Online Cake Delivery in Gurgaon – From Our Oven to Your Occasion</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Enjoy reliable cake delivery in Gurgaon that's prompt, professional, and handled with care. With CakesBuy, your custom cake arrives fresh, flawless, and full of flavour — exactly the way you pictured it. Explore our complete collection of cakes for <Link href="/" className="text-pink-600 hover:text-pink-700 font-semibold underline decoration-2 underline-offset-2">online cake delivery Gurgaon</Link> and discover why we're the preferred choice for celebrations across the city.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">100% Eggless</h4>
                  <p className="text-gray-600">All our customized cakes are completely eggless</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Same Day Delivery</h4>
                  <p className="text-gray-600">Quick delivery across Gurgaon within hours</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Expert Bakers</h4>
                  <p className="text-gray-600">Skilled artisans bringing your vision to life</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Create Your Dream Cake?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let's bring your sweetest imagination to life with our expert customization services
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => window.open('https://wa.me/918287177303', '_blank')}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Start Your Custom Order
              </Button>
              
              <Link href="/cakes/photo-cakes">
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-pink-600 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Browse Photo Cakes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}