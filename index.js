const express = require("express")
const _ = require('lodash');
var memoize = require('lodash.memoize');


const app = express()
app.use(express.json())


//Middleware
async function getBlogData(req, res, next) {
  try {
    const response = await fetch("https://intent-kit-16.hasura.app/api/rest/blogs", {
      headers: {
        "x-hasura-admin-secret": "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    const data = await response.json();
    req.blogData = data.blogs
    next()
  } catch (error) {
    next(error)
  }
}


//Routes
app.get("/", (req, res) => {
  res.send("API by Aman")
})

const memoizeBlogData = memoize((req) => {
  const blogs = req.blogData;
  const totalBlogs = blogs.length;
  const longestBlog = _.maxBy(blogs, 'title.length');
  const privacyBlogs = _.filter(blogs, (blog) => blog.title.toLowerCase().includes('privacy'));
  const uniqueTitles = _.uniqBy(blogs, 'title').map((blog) => blog.title);

  return {
    totalBlogs,
    longestBlog: longestBlog.title,
    privacyBlogs: privacyBlogs.length,
    uniqueTitles,
  };
});

const memoizeBlogSearch = memoize((req) => {
  const query = req.query.query;
  const blogs = req.blogData;
  if (!query) {
    return { error: "Query Parameter is required." };
  }
  const searchResults = blogs.filter((blog) => blog.title.toLowerCase().includes(query.toLowerCase()));

  return { items: searchResults.length, searchResults };
});


// Get blog analytics
app.get("/api/blog-stats", getBlogData, (req, res) => {
  const results = memoizeBlogData(req);
  res.status(200).json(results);
})
// get blogs by query search
app.get("/api/blog-search", getBlogData, (req, res) => {
  const results = memoizeBlogSearch(req);
  if (results.error) {
    // Handle the error by sending an appropriate response
    res.status(400).json(results);
  } else {
    // Send the successful response
    res.status(200).json(results);
  }
})


app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(3000, () => {
  console.log("Server started on port 3000...")
})