import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, Heart, Camera, Cake, Gift, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function CustomizedCakesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample customized cake images and data
  const customizedCakes = [
    {
      id: 1,
      name: "Nature Theme Birthday Cake",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop",
      category: "birthday",
      description: "Multi-tier cake with fondant animals and nature elements",
      price: "₹2,499",
      rating: 4.8,
      reviews: 45
    },
    {
      id: 2,
      name: "Wedding Anniversary Special",
      image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=400&fit=crop",
      category: "anniversary",
      description: "Elegant two-tier cake with personalized photo and golden accents",
      price: "₹3,299",
      rating: 4.9,
      reviews: 32
    },
    {
      id: 3,
      name: "Kids Character Theme",
      image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=400&fit=crop",
      category: "kids",
      description: "Colorful themed cake with favorite cartoon characters",
      price: "₹1,899",
      rating: 4.7,
      reviews: 67
    },
    {
      id: 4,
      name: "Corporate Event Cake",
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&h=400&fit=crop",
      category: "corporate",
      description: "Professional cake design with company logo and branding",
      price: "₹4,599",
      rating: 4.6,
      reviews: 23
    },
    {
      id: 5,
      name: "Photo Memory Cake",
      image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=400&fit=crop",
      category: "photo",
      description: "Personalized cake with edible photo print and custom message",
      price: "₹1,799",
      rating: 4.8,
      reviews: 89
    },
    {
      id: 6,
      name: "Luxury Wedding Cake",
      image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=400&fit=crop",
      category: "wedding",
      description: "Three-tier wedding cake with intricate sugar flower details",
      price: "₹5,999",
      rating: 5.0,
      reviews: 18
    }
  ];

  const categories = [
    { id: 'all', name: 'All Designs', count: customizedCakes.length },
    { id: 'birthday', name: 'Birthday', count: customizedCakes.filter(c => c.category === 'birthday').length },
    { id: 'wedding', name: 'Wedding', count: customizedCakes.filter(c => c.category === 'wedding').length },
    { id: 'anniversary', name: 'Anniversary', count: customizedCakes.filter(c => c.category === 'anniversary').length },
    { id: 'kids', name: 'Kids Special', count: customizedCakes.filter(c => c.category === 'kids').length },
    { id: 'photo', name: 'Photo Cakes', count: customizedCakes.filter(c => c.category === 'photo').length },
    { id: 'corporate', name: 'Corporate', count: customizedCakes.filter(c => c.category === 'corporate').length }
  ];

  const features = [
    {
      icon: Camera,
      title: "Photo Perfect",
      description: "Upload your favorite photos and we'll create edible prints with stunning clarity"
    },
    {
      icon: Cake,
      title: "Custom Flavors",
      description: "Choose from 20+ premium flavors or create your own unique combination"
    },
    {
      icon: Gift,
      title: "Personal Touch",
      description: "Add custom messages, names, and special decorative elements"
    },
    {
      icon: Sparkles,
      title: "Artistic Design",
      description: "Our expert bakers bring your imagination to life with artistic precision"
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

  const filteredCakes = selectedCategory === 'all' 
    ? customizedCakes 
    : customizedCakes.filter(cake => cake.category === selectedCategory);

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
              onClick={() => window.open('https://wa.me/1234567890', '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with us on WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
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
                <Card key={index} className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-pink-50 to-orange-50">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
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

      {/* Our Customized Cakes Gallery */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Customised Cakes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Tailored Sweetness: Explore CakesBuy's Customised Cake Creations
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-6 py-2 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-pink-500 text-white shadow-lg transform scale-105'
                    : 'hover:bg-pink-50 hover:border-pink-300'
                }`}
              >
                {category.name}
                <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Cakes Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCakes.map((cake) => (
              <Card key={cake.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 overflow-hidden border-0 bg-white">
                <div className="relative overflow-hidden">
                  <img
                    src={cake.image}
                    alt={cake.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Button size="icon" variant="outline" className="rounded-full bg-white/90 hover:bg-white shadow-lg">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-green-500 text-white">Custom Design</Badge>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                    {cake.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{cake.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">{cake.rating}</span>
                      <span className="text-sm text-gray-500">({cake.reviews} reviews)</span>
                    </div>
                    <div className="text-2xl font-bold text-pink-600">{cake.price}</div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 rounded-full font-semibold shadow-lg">
                    Customize This Design
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gradient-to-r from-pink-100 via-purple-50 to-orange-50">
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
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Tailored Sweetness: Explore CakesBuy's Customised Cake Creations
              </h2>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl p-8 md:p-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Indulge in the world of delicious artistry with our customised cakes, designed to mirror your imagination and taste preferences. At CakesBuy, we believe that every celebration deserves a cake as unique as the occasion itself. Whether it's a birthday, wedding, anniversary, or any special event, our customised cakes allow you to be the creator of your own sweet masterpiece. From selecting your preferred flavours and fillings to choosing the perfect design that matches your theme, our expert bakers work closely with you to bring your vision to life. Easily purchase an online customised cake by browsing our heavenly collection. The seamless and convenient process allows you to order from the comfort of your home and also a true reflection of your style and the sweetness that tells your story, and let CakesBuy turn your sweetest dreams into reality.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Experience the convenience of <strong>online cake delivery</strong> with CakesBuy, where customisation creation is delivered with care, on time, and exactly as you envisioned it. We understand the importance of punctuality and precision when it comes to special occasions, which is why we ensure that every cake is handled with the utmost care from the moment it leaves our kitchen to the moment it reaches your celebration. With CakesBuy, you have full control and supervision over your customised cake creation but rest assured that you will have the cake that not only meets your expectations, but exceeds them, creating memories that last a lifetime.
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
      <div className="py-20 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Create Your Dream Cake?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let's bring your sweetest imagination to life with our expert customization services
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => window.open('https://wa.me/1234567890', '_blank')}
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