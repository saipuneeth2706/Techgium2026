import { Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";

// Mock Data
const HERO_MOVIE = {
  id: "hero-1",
  title: "Stranger Things",
  description:
    "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
  image:
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop",
};

const CATEGORIES = [
  {
    title: "Trending Now",
    movies: [
      {
        id: 1,
        title: "Inception",
        image:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 2,
        title: "Dark Knight",
        image:
          "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 3,
        title: "Interstellar",
        image:
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 4,
        title: "Matrix",
        image:
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 5,
        title: "Avatar",
        image:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
  {
    title: "Action",
    movies: [
      {
        id: 6,
        title: "Avengers",
        image:
          "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=500&auto=format&fit=crop&q=60",
      }, // Reusing images for mock
      {
        id: 7,
        title: "Top Gun",
        image:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 8,
        title: "Gladiator",
        image:
          "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 9,
        title: "Die Hard",
        image:
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
  {
    title: "Sci-Fi",
    movies: [
      {
        id: 10,
        title: "Star Wars",
        image:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 11,
        title: "Dune",
        image:
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60",
      },
      {
        id: 12,
        title: "Blade Runner",
        image:
          "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#141414] min-h-screen text-white pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[80vh] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_MOVIE.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
        </div>

        <div className="absolute bottom-[30%] left-4 md:left-12 max-w-xl space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-lg">
            {HERO_MOVIE.title}
          </h1>
          <p className="text-lg text-gray-200 drop-shadow-md">
            {HERO_MOVIE.description}
          </p>
          <div className="flex space-x-4 pt-4">
            <Button
              className="bg-white text-black hover:bg-white/80 px-8 py-3 font-bold flex items-center gap-2"
              onClick={() => navigate("/watch/hero")}
            >
              <Play className="fill-black w-6 h-6" /> Play
            </Button>
            <Button
              variant="secondary"
              className="bg-gray-500/70 hover:bg-gray-500/50 px-8 py-3 font-bold flex items-center gap-2"
            >
              <Info className="w-6 h-6" /> More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="-mt-16 md:-mt-32 relative z-10 pl-4 md:pl-12 space-y-12">
        {CATEGORIES.map((category) => (
          <div key={category.title}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-200 hover:text-white cursor-pointer transition-colors">
              {category.title}
            </h2>
            <div className="flex space-x-4 overflow-x-scroll scrollbar-hide pb-4 pr-12">
              {category.movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-none w-[200px] md:w-[240px] aspect-video relative group cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-20 origin-center"
                  onClick={() => navigate(`/watch/${movie.id}`)}
                >
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover rounded-md shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <Play className="text-white w-12 h-12 fill-white opacity-80" />
                  </div>
                  <h3 className="mt-2 text-sm text-center text-gray-300 group-hover:text-white">
                    {movie.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
