import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ShoppingBag, Truck, Shield, Clock, CheckCircle, Star, Gift, Wallet } from 'lucide-react';
import { Category, Cake } from '@shared/schema';
import CategoryCard from '@/components/category-card';
import CakeCard from '@/components/cake-card';
import CategoriesShowcase from '@/components/CategoriesShowcase';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: featuredCakesData, isLoading: cakesLoading } = useQuery<{
    cakes: Cake[];
    total: number;
    pages: number;
  }>({
    queryKey: ['/api/cakes', { isBestseller: true }],
    queryFn: async () => {
      const response = await fetch('/api/cakes?isBestseller=true&limit=8');
      if (!response.ok) throw new Error('Failed to fetch featured cakes');
      return response.json();
    },
  });

  const featuredCakes = featuredCakesData?.cakes || [];

  return (
    <div className="bg-cream">
      {/* Wallet Reward Banner - Only for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center space-x-2">
            <Gift className="h-5 w-5" />
            <span className="text-sm font-medium">
              🎉 New User Special: Sign up now and get ₹50 wallet credit instantly! 
            </span>
            <Link href="/auth">
              <Button size="sm" className="bg-white text-orange-600 hover:bg-gray-100 ml-2">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="hero-gradient py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-charcoal mb-6">
                100% Eggless<br />
                <span className="text-brown">Fresh Cakes</span><br />
                <span className="text-caramel">Online Delivery</span>
              </h1>
              <p className="text-lg text-charcoal mb-8 opacity-80">
                Delicious eggless cakes made with love. Perfect for vegetarians and everyone who loves fresh, healthy treats. Same-day online delivery across Gurgaon.
              </p>
              
              {/* Eggless Badge */}
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
                  🥚 100% EGGLESS GUARANTEED
                </Badge>
              </div>
              
              {/* Quick Order Section */}
              <Card className="mb-8 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-charcoal mb-4">Quick Order</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/cakes/birthday-cakes">
                      <Button className="w-full bg-pink text-white hover:bg-opacity-90 transition">
                        🎂 Birthday Cakes
                      </Button>
                    </Link>
                    <Link href="/cakes/anniversary-cakes">
                      <Button className="w-full bg-caramel text-white hover:bg-brown transition">
                        💕 Anniversary Cakes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>



              {/* Trust Indicators */}
              <div className="flex items-center justify-center lg:justify-start space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brown">100%</div>
                  <div className="text-sm text-charcoal opacity-70">Eggless Recipe</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brown">Same Day</div>
                  <div className="text-sm text-charcoal opacity-70">Online Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brown">₹0</div>
                  <div className="text-sm text-charcoal opacity-70">Delivery above ₹500</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop" 
                alt="Premium birthday cake with decorations" 
                className="rounded-3xl shadow-2xl w-full animate-float"
              />
              
              <Badge className="absolute top-4 right-4 bg-mint text-white font-semibold shadow-lg">
                <Truck className="mr-2 h-4 w-4" />
                Same Day Delivery
              </Badge>
              
              <Badge className="absolute bottom-4 left-4 bg-pink text-white font-semibold shadow-lg">
                <span className="mr-2">%</span>
                20% OFF First Order
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Bar */}
      <section className="bg-brown text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Same Day Online Delivery
            </div>
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              100% Eggless & Fresh
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Vegetarian Friendly
            </div>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              Contactless Delivery
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase Section */}
      <CategoriesShowcase />

      {/* India Loves Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Star className="text-yellow-500 mr-2 h-8 w-8 fill-current" />
              <h2 className="text-3xl lg:text-4xl font-bold text-red-600">
                Loved by Gurgaon, Baked by CakesBuy
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              From Birthday Classics to Designer Delights
            </p>
          </div>

          {cakesLoading ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse w-64 flex-shrink-0">
                    <div className="bg-gray-200 h-48"></div>
                    <CardContent className="p-4">
                      <div className="bg-gray-200 rounded h-4 mb-2"></div>
                      <div className="bg-gray-200 rounded h-3 mb-2"></div>
                      <div className="bg-gray-200 rounded h-6"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-4 px-2" style={{ width: 'max-content' }}>
                {featuredCakes.map((cake, index) => (
                  <Link key={cake.id} href={`/product/${cake.slug}`}>
                    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-64 flex-shrink-0 border hover:border-caramel/30">
                      <div className="relative">
                        {/* Veg indicator */}
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-4 h-4 border-2 border-green-600 rounded-sm bg-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* Cake Image */}
                        <div className="h-48 bg-gray-100 overflow-hidden">
                          {cake.images && cake.images.length > 0 ? (
                            <img 
                              src={cake.images[0]} 
                              alt={cake.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-caramel/20 to-brown/20 flex items-center justify-center">
                              <span className="text-gray-400 text-4xl">🎂</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        {/* Cake Name */}
                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 text-sm">
                          {cake.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center mb-2">
                          <div className="flex items-center bg-green-600 text-white px-1 py-0.5 rounded text-xs">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            <span className="font-medium">4.{Math.floor(Math.random() * 5) + 4}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.floor(Math.random() * 500) + 100} Reviews)
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const weightPrice = cake.weights && cake.weights.length > 0 ? cake.weights[0].price : null;
                              const basePrice = cake.basePrice ? parseFloat(cake.basePrice.toString()) : 0;
                              const price = weightPrice || basePrice || 0;
                              return (
                                <span className="text-lg font-bold text-gray-800">₹{price}</span>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>





      {/* Delivery Promise Section */}
      <section className="py-16 bg-gradient-to-r from-caramel to-brown text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Same Day Online Delivery</h3>
              <p className="text-sm opacity-90">Order online before 2 PM for contactless same day delivery</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Eggless & Fresh</h3>
              <p className="text-sm opacity-90">All cakes are completely egg-free with premium ingredients</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Safe Packaging</h3>
              <p className="text-sm opacity-90">Hygienic packaging ensures cake reaches you safely</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">All Sectors</h3>
              <p className="text-sm opacity-90">Delivering to all sectors of Gurgaon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Order Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-6">
                Create Your Dream Eggless Cake
              </h2>
              <p className="text-lg text-charcoal opacity-70 mb-8">
                Our expert bakers create 100% eggless custom cakes that taste amazing. Choose your flavors, design, and personal message - all completely egg-free.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-caramel text-white p-2 rounded-lg">
                    🎨
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">Custom Design</h4>
                    <p className="text-charcoal opacity-70">Upload your design or describe your vision</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-caramel text-white p-2 rounded-lg">
                    🎂
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">Eggless Flavor Selection</h4>
                    <p className="text-charcoal opacity-70">Choose from 20+ eggless flavors and fillings</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-caramel text-white p-2 rounded-lg">
                    ✍️
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">Personal Message</h4>
                    <p className="text-charcoal opacity-70">Add your special message or photo</p>
                  </div>
                </div>
              </div>

              <Link href="/cakes/photo-cakes">
                <Button size="lg" className="bg-brown text-white hover:bg-opacity-90">
                  Start Customizing
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop" 
                alt="Custom decorated cake with photo print" 
                className="rounded-xl shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&h=300&fit=crop" 
                alt="Elegant wedding cake with multiple tiers" 
                className="rounded-xl shadow-lg mt-8"
              />
              <img 
                src="https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&h=300&fit=crop" 
                alt="Custom character themed cake for kids" 
                className="rounded-xl shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop" 
                alt="Artistic custom decorated anniversary cake" 
                className="rounded-xl shadow-lg mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose CakesBuy Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
              Why Choose CakesBuy?
            </h2>
            <p className="text-lg text-charcoal opacity-70">
              Gurgaon's leading 100% eggless cake online delivery service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-caramel/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-caramel" />
                </div>
                <h3 className="font-bold text-xl text-charcoal mb-3">Premium Quality</h3>
                <p className="text-charcoal opacity-70">
                  Made with finest ingredients by expert bakers. Every cake is crafted with love and precision.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-caramel/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-caramel" />
                </div>
                <h3 className="font-bold text-xl text-charcoal mb-3">On-Time Delivery</h3>
                <p className="text-charcoal opacity-70">
                  Same-day and midnight delivery options. We ensure your celebrations are never delayed.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-caramel/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Star className="h-8 w-8 text-caramel fill-current" />
                </div>
                <h3 className="font-bold text-xl text-charcoal mb-3">5000+ Happy Customers</h3>
                <p className="text-charcoal opacity-70">
                  Trusted by thousands of families across Gurgaon for their special moments and celebrations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
              Happy Customers in Gurgaon
            </h2>
            <p className="text-lg text-charcoal opacity-70">
              Read what our customers say about us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                rating: 5,
                comment: "Amazing chocolate cake for my daughter's birthday! The delivery was right on time at midnight and the cake was absolutely fresh. The customization options were perfect.",
                name: "Priya Sharma",
                location: "Sector 56, Gurgaon"
              },
              {
                rating: 5,
                comment: "Best eggless cakes in Gurgaon! The strawberry delight was phenomenal. Great packaging and the add-ons like balloons made it extra special. Highly recommended!",
                name: "Rajesh Kumar",
                location: "DLF Phase 2"
              },
              {
                rating: 5,
                comment: "Custom anniversary cake was exactly what we wanted! The design team understood our requirements perfectly. Delivery to Cyber City was prompt and professional.",
                name: "Neha & Amit",
                location: "Cyber City, Gurgaon"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-charcoal opacity-60 ml-2">5/5</span>
                  </div>
                  
                  <p className="text-charcoal mb-4">
                    "{testimonial.comment}"
                  </p>
                  
                  <div className="flex items-center">
                    <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      👤
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal">{testimonial.name}</div>
                      <div className="text-sm text-charcoal opacity-60">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center space-x-8 mt-12 flex-wrap gap-4">
            <Badge variant="secondary" className="bg-white px-4 py-2 shadow">
              <Shield className="mr-2 h-4 w-4 text-mint" />
              SSL Secured
            </Badge>
            <Badge variant="secondary" className="bg-white px-4 py-2 shadow">
              <CheckCircle className="mr-2 h-4 w-4 text-mint" />
              100% Fresh
            </Badge>
            <Badge variant="secondary" className="bg-white px-4 py-2 shadow">
              <Truck className="mr-2 h-4 w-4 text-mint" />
              Same Day Delivery
            </Badge>
            <Badge variant="secondary" className="bg-white px-4 py-2 shadow">
              <Clock className="mr-2 h-4 w-4 text-mint" />
              24/7 Support
            </Badge>
          </div>
        </div>
      </section>

      {/* Promotional Section */}
      <section className="py-16 bg-gradient-to-r from-caramel to-brown text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Special Offer for New Customers
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Get 20% OFF on your first order + Free delivery anywhere in Gurgaon
          </p>
          
          <Card className="bg-white text-charcoal rounded-2xl p-6 inline-block mb-8">
            <CardContent className="p-0">
              <div className="text-3xl font-bold mb-2">FIRST20</div>
              <div className="text-sm opacity-70">Use this code at checkout</div>
            </CardContent>
          </Card>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link href="/category/all">
              <Button size="lg" className="bg-white text-brown hover:bg-opacity-90">
                Order Now & Save
              </Button>
            </Link>
            <Link href="/category/all">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-brown">
                Browse Cakes
              </Button>
            </Link>
          </div>
          
          <p className="text-sm mt-6 opacity-80">
            * Valid for orders above ₹500. Cannot be combined with other offers.
          </p>
        </div>
      </section>
    </div>
  );
}
