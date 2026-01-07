'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { News } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function NewsPage() {
  const { data: newsList, isLoading } = useQuery({
    queryKey: ['publicNews'],
    queryFn: () => adminApi.getAllNews(20),
  });

  // Filter only published news
  const publishedNews = newsList?.filter((n: News) => n.isPublished) || [];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'PRODUCTS':
        return <Badge className="bg-blue-100 text-blue-800">Products</Badge>;
      case 'SERVICES':
        return <Badge className="bg-purple-100 text-purple-800">Services</Badge>;
      case 'ANNOUNCEMENTS':
        return <Badge className="bg-orange-100 text-orange-800">Announcements</Badge>;
      case 'PROMOTIONS':
        return <Badge className="bg-green-100 text-green-800">Promotions</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">News & Updates</h1>
        <p className="text-gray-500">Stay informed about Bank Avenir's latest news and announcements</p>
      </div>

      {/* News List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading news...</div>
      ) : publishedNews.length > 0 ? (
        <div className="grid gap-6">
          {publishedNews.map((news: News) => (
            <Card key={news.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(news.category)}
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(news.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{news.title}</CardTitle>
                  </div>
                  <Newspaper className="h-6 w-6 text-gray-400 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{news.content}</p>
                {news.author && (
                  <p className="text-sm text-gray-400 mt-4">
                    Published by {news.author.profile?.firstName} {news.author.profile?.lastName}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No news available</p>
              <p className="text-sm">Check back later for updates</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
