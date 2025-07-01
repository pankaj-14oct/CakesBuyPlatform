import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ShoppingBag, Truck, Shield, Clock, CheckCircle, Star } from 'lucide-react';
import { Category, Cake } from '@shared/schema';
import CategoryCard from '@/components/category-card';
import CakeCard from '@/components/cake-card';

export default function Home() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: featuredCakes = [], isLoading: cakesLoading } = useQuery<Cake[]>({
    queryKey: ['/api/cakes', { isBestseller: true }],
    queryFn: async () => {
      const response = await fetch('/api/cakes?isBestseller=true');
      if (!response.ok) throw new Error('Failed to fetch featured cakes');
      return response.json();
    },
  });

  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="hero-gradient py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-charcoal mb-6">
                Fresh Cakes<br />
                <span className="text-brown">Delivered Daily</span><br />
                <span className="text-caramel">in Gurgaon</span>
              </h1>
              <p className="text-lg text-charcoal mb-8 opacity-80">
                Premium handcrafted cakes for every celebration. Same-day delivery available across Gurgaon sectors.
              </p>
              
              {/* Quick Order Section */}
              <Card className="mb-8 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-charcoal mb-4">Quick Order</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/category/birthday">
                      <Button className="w-full bg-pink text-white hover:bg-opacity-90 transition">
                        🎂 Birthday Cakes
                      </Button>
                    </Link>
                    <Link href="/category/anniversary">
                      <Button className="w-full bg-caramel text-white hover:bg-brown transition">
                        💖 Anniversary
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/category/all">
                  <Button size="lg" className="bg-brown text-white hover:bg-opacity-90 transition">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Order Now
                  </Button>
                </Link>
                <Link href="/category/all">
                  <Button variant="outline" size="lg" className="border-brown text-brown hover:bg-brown hover:text-white transition">
                    View Menu
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center lg:justify-start space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brown">2000+</div>
                  <div className="text-sm text-charcoal opacity-70">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brown">24hrs</div>
                  <div className="text-sm text-charcoal opacity-70">Fresh Guarantee</div>
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
              Same Day & Midnight Delivery
            </div>
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              100% Fresh Guarantee
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Secure Payment
            </div>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              All Gurgaon Sectors Covered
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Access */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-charcoal mb-4">
              What will you wish for?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <Link href="/category/all">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🎂</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">CLASSIC</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/category/gourmet">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🍰</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">GOURMET</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/category/designer">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">DESIGNER</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/category/desserts">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🧁</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">DESSERTS</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/category/cookies">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🍪</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">COOKIES</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/category/hampers">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🎁</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel">HAMPERS</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
              Browse Our Cake Categories
            </h2>
            <p className="text-lg text-charcoal opacity-70">
              From classic birthdays to custom creations, find the perfect cake for every occasion
            </p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-24 mb-4"></div>
                  <div className="bg-gray-200 rounded h-4 mb-2"></div>
                  <div className="bg-gray-200 rounded h-3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gurgaon Loves Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="text-caramel mr-2 h-6 w-6 fill-current" />
              <h2 className="text-3xl lg:text-4xl font-bold text-charcoal">
                Gurgaon Loves
              </h2>
            </div>
            <p className="text-lg text-charcoal opacity-70">
              Bestsellers from across the city
            </p>
          </div>

          {cakesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48"></div>
                  <CardContent className="p-6">
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-3 mb-4"></div>
                    <div className="bg-gray-200 rounded h-8"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCakes.slice(0, 4).map((cake) => (
                <CakeCard key={cake.id} cake={cake} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Cakes */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
                All Bestselling Cakes
              </h2>
              <p className="text-lg text-charcoal opacity-70">
                Most loved by Gurgaon customers
              </p>
            </div>
            
            <div className="hidden md:flex space-x-4">
              <Button variant="outline" className="border-caramel text-caramel hover:bg-caramel hover:text-white">
                All
              </Button>
              <Button variant="ghost" className="text-charcoal hover:text-caramel">
                Birthday
              </Button>
              <Button variant="ghost" className="text-charcoal hover:text-caramel">
                Eggless
              </Button>
              <Button variant="ghost" className="text-charcoal hover:text-caramel">
                Custom
              </Button>
            </div>
          </div>

          {cakesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48"></div>
                  <CardContent className="p-6">
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-3 mb-4"></div>
                    <div className="bg-gray-200 rounded h-8"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {featuredCakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/category/all">
              <Button size="lg" className="bg-brown text-white hover:bg-opacity-90">
                View All Cakes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Occasions Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
              Special Occasions
            </h2>
            <p className="text-lg text-charcoal opacity-70">
              Perfect cakes for every celebration
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <Link href="/category/birthday">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">🎂</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Birthday</h3>
                  <p className="text-xs text-charcoal opacity-60">Celebrate with joy</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/category/anniversary">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">💕</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Anniversary</h3>
                  <p className="text-xs text-charcoal opacity-60">Love & togetherness</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/category/wedding">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">💒</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Wedding</h3>
                  <p className="text-xs text-charcoal opacity-60">Perfect union</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/category/graduation">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">🎓</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Graduation</h3>
                  <p className="text-xs text-charcoal opacity-60">Achievement unlocked</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/category/baby-shower">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">👶</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Baby Shower</h3>
                  <p className="text-xs text-charcoal opacity-60">New beginnings</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/category/farewell">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">👋</div>
                  <h3 className="font-semibold text-charcoal group-hover:text-caramel mb-2">Farewell</h3>
                  <p className="text-xs text-charcoal opacity-60">Best wishes ahead</p>
                </CardContent>
              </Card>
            </Link>
          </div>
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
              <h3 className="font-bold text-lg mb-2">Same Day Delivery</h3>
              <p className="text-sm opacity-90">Order before 2 PM for same day delivery across Gurgaon</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Fresh</h3>
              <p className="text-sm opacity-90">Made fresh daily with premium ingredients</p>
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
                Create Your Dream Cake
              </h2>
              <p className="text-lg text-charcoal opacity-70 mb-8">
                Our expert bakers bring your vision to life with completely customizable cakes. Choose your flavors, design, and personal message.
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
                    <h4 className="font-semibold text-charcoal">Flavor Selection</h4>
                    <p className="text-charcoal opacity-70">Choose from 20+ flavors and fillings</p>
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

              <Button size="lg" className="bg-brown text-white hover:bg-opacity-90">
                Start Customizing
              </Button>
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
              Leading cake delivery service in Gurgaon
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
