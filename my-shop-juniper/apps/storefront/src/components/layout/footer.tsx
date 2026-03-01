import { cacheLife } from "next/cache";
import { getTopCollections } from "@/lib/vendure/cached";
import Image from "next/image";
import Link from "next/link";

async function Copyright() {
  "use cache";
  cacheLife("days");

  return (
    <div>© {new Date().getFullYear()} Viva Luthiers. All rights reserved.</div>
  );
}

export async function Footer() {
  "use cache";
  cacheLife("days");

  const collections = await getTopCollections();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <p className="text-sm font-semibold mb-4 uppercase tracking-wider">
              Viva Luthiers
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-4">Categories</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/collection/${collection.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Viva Luthiers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Return Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <Copyright />
          <div className="flex items-center gap-2">{/* extra space */}</div>
        </div>
      </div>
    </footer>
  );
}
