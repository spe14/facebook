package main.java.edu.upenn.cis.nets2120.loading;

import java.io.IOException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.apache.spark.api.java.*;
//import org.apache.spark.api.java.function.*;
import org.apache.spark.sql.SparkSession;
import org.apache.livy.*;

//import org.apache.spark.api.java.JavaPairRDD;
//import org.apache.spark.api.java.JavaRDD;
//import org.apache.spark.api.java.JavaSparkContext;


import main.java.edu.upenn.cis.nets2120.config.Config;
import main.java.edu.upenn.cis.nets2120.storage.SparkConnector;
import main.java.edu.upenn.cis.nets2120.storage.DynamoConnector;
import scala.Tuple2;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

//import com.amazonaws.AmazonServiceException;
//import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
//import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;

import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.Index;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.spec.QuerySpec;
import com.amazonaws.services.dynamodbv2.document.spec.ScanSpec;
import com.amazonaws.services.dynamodbv2.document.QueryOutcome;
import com.amazonaws.services.dynamodbv2.document.ScanOutcome;

//import com.amazonaws.services.dynamodbv2.model.AttributeValue;
//import com.amazonaws.services.dynamodbv2.model.GetItemRequest;
//import com.amazonaws.services.dynamodbv2.model.Select;
//import com.amazonaws.services.dynamodbv2.model.AmazonDynamoDBException;

import com.amazonaws.services.dynamodbv2.document.utils.NameMap;
import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;

//import java.io.FileWriter;

// Initialize a new class for the node object that will be used to represent the vertices of
// the desired social network graph - specifically, the graph will be a JavaRDD<Node> object

class Node implements java.io.Serializable{
	private static final long serialVersionUID = 1L;

	// Fields - type of node (user, category, article), label of node (String input), 
	// corresponding edge weight
	public String type;
	
	public String nodeLabel;
	
	// nodeLabel for user is username, interest name for category, and URL for article
	public Node(String type, String nodeLabel) {
		this.type = type;
		this.nodeLabel = nodeLabel;
		
	}
	
}

public class AdsorptionJob implements Job<String> {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	DynamoDB db = DynamoConnector.getConnection("https://dynamodb.us-east-1.amazonaws.com");
	Table users = db.getTable("users");
	Table news = db.getTable("news");
	Table friends = db.getTable("friends");
	Table likedArticles = db.getTable("likedArticles"); // Partition key is the user, sort key is URL (only 2 columns needed)
	Table recommendedArticles = db.getTable("recommendedArticles");
	
	Index interestsIndex = news.getIndex("category-date-index");
	Index dateIndex = news.getIndex("date-index");
	
	// This instance field is the person for whom we will be recommending the news article
	String currentUser;
	
	/**
	 * Connection to Apache Spark
	 */
	SparkSession spark;
	
	JavaSparkContext context;
	

	/**
	 * Initialize the database connection and open the file
	 * 
	 * @throws IOException
	 * @throws InterruptedException 
	 * @throws DynamoDbException 
	 */
	public void initialize() throws IOException, InterruptedException {
		System.out.println("Connecting to Spark...");
		spark = SparkConnector.getSparkConnection();
		context = SparkConnector.getSparkContext();
		
		System.out.println("Connected!");
		
	}
	
	public JavaPairRDD<Node, Tuple2<Node, Double>> createSocialNetwork() {
		// Perform DynamoDB queries/scans of the desired tables to get the information we want and populate different
		// Node objects using the outputs of these searches
		
		// Define the ArrayLists of tuples of nodes that, when parallelized by the Spark context, will comprise
		// the JavaPairRDDs used in the adsorption algorithm
		ArrayList<Tuple2<Node, Node>> listOfArticleToInterestEdges = new ArrayList<>();
		ArrayList<Tuple2<Node, Node>> listOfFriendEdges = new ArrayList<>();
		ArrayList<Tuple2<Node, Node>> listOfUserToInterestEdges = new ArrayList<>();
		ArrayList<Tuple2<Node, Node>> listOfUserToArticleEdges = new ArrayList<>();
		
		// Part 1: Query news table for all news that are either from the current day or earlier and apply a ProjectionExpression to 
		// only get the category that each news article is part of (perform 15 different queries to get the categories in which people
		// can express their interests)
		LocalDate dateObj = LocalDate.now();
		DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		String date = dateObj.format(f);
		
		String[] topics = new String[15];
		topics[0] = "POLITICS";
		topics[1] = "WELLNESS";
		topics[2] = "ENTERTAINMENT";
		topics[3] = "TRAVEL";
		topics[4] = "STYLE AND BEAUTY";
		topics[5] = "PARENTING";
		topics[6] = "HEALTHY LIVING";
		topics[7] = "QUEER VOICES";
		topics[8] = "FOOD AND DRINK";
		topics[9] = "BUSINESS";
		topics[10] = "COMEDY";
		topics[11] = "SPORTS";
		topics[12] = "BLACK VOICES";
		topics[13] = "HOME AND LIVING";
		topics[14] = "PARENTS";
		
		// For each topic, create the QuerySpec object that will be used to query the news table for all the relevant news of 
		// that topic which are from today's date or earlier
		
		// Initialize relevant while loop variables for inside for loops
		Node articleNode;
		Node interestNode;
		
		Node userNodeOne;
		Node userNodeTwo;
		
		String currFriendOne;
		String currFriendTwo;
		
		String currUser;
		LinkedHashSet<String> currInterests;
		String currLink;
		Item item;
		
		for (int i = 0; i < 15; i++) {
			QuerySpec qs = new QuerySpec()
					.withKeyConditionExpression("#c = :category and #date <= :date")
					.withProjectionExpression("link")
					.withNameMap(new NameMap().with("#c", "category").with("#date", "date"))
					.withValueMap(new ValueMap().withString(":category", topics[i]).withString(":date", date));
			
			ItemCollection<QueryOutcome> newsQuery = interestsIndex.query(qs);
			Iterator<Item> newsIter = newsQuery.iterator();
			
			interestNode = new Node("category", topics[i]);
			
			while (newsIter.hasNext()) {
				item = newsIter.next();
				
				currLink = (String) item.get("link");
				articleNode = new Node("article", currLink);
					
				// Add the edge between the news article and its category to the ArrayList
				// listOfArticleToInterestEdges so that we can form a JavaPairRDD later with 
				// all the (a, c) / (c, a) edges
				listOfArticleToInterestEdges.add(new Tuple2<>(articleNode, interestNode));
				
			}
			
		}
		
		// Define the RDD of edges from articles to the category they are part of
		JavaPairRDD<Node, Node> articleToInterestEdgesRDD = context.parallelizePairs(listOfArticleToInterestEdges);
		
		// Flip the edges so that the (c, a) edges are included
		JavaPairRDD<Node, Node> interestToArticleEdgesRDD = articleToInterestEdgesRDD.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
		
		
		// Part 2: Scan friends table to get all the necessary edges between users that are friends 
		// (i.e., the (u, u') / (u', u) edges)
		ScanSpec ssOne = new ScanSpec()
			.withProjectionExpression("friend1, friend2");
		
		ItemCollection<ScanOutcome> scanOne = friends.scan(ssOne);
		Iterator<Item> iterOne = scanOne.iterator();
		
		while (iterOne.hasNext()) {
			item = iterOne.next();
			
			currFriendOne = (String) item.get("friend1");
			currFriendTwo = (String) item.get("friend2");
			
			userNodeOne = new Node("user", currFriendOne);
			userNodeTwo = new Node("user", currFriendTwo);
			
			// Add a tuple to the friend edge list for later JavaPairRDD conversion
			listOfFriendEdges.add(new Tuple2<>(userNodeOne, userNodeTwo));
			
		}
		
		// Convert the list to a JavaPairRDD of edges
		JavaPairRDD<Node, Node> allFriendEdgesRDD = context.parallelizePairs(listOfFriendEdges);
		
		// Part 3: Scan the users table to get the list of all users and each of their corresponding 
		// list of interests (i.e, all (u, c) / (c, u) edges)
		ScanSpec ssTwo = new ScanSpec()
			.withProjectionExpression("username, interests");
		
		ItemCollection<ScanOutcome> scanTwo = users.scan(ssTwo);
		Iterator<Item> iterTwo = scanTwo.iterator();
		
		// Initialize a new ArrayList that will store all users extracted from the users table scan - 
		// this will be iterated through to generate the queries for the liked news article table
		ArrayList<String> allUsers = new ArrayList<>();
		
		while (iterTwo.hasNext()) {
			item = iterTwo.next();
			
			currUser = (String) item.get("username");
			System.out.print("check" + item.get("interests"));
			LinkedHashSet<String>lst = (LinkedHashSet<String>) item.get("interests");
			
			
			allUsers.add(currUser);
			userNodeOne = new Node("user", currUser);
			for (String s: lst) {
				interestNode = new Node("category", s);
				listOfUserToInterestEdges.add(new Tuple2<>(userNodeOne, interestNode));
				
			}
//			for (int i = 0; i < currInterests.length; i++) {
//				interestNode = new Node("category", currInterests[i]);
//				listOfUserToInterestEdges.add(new Tuple2<>(userNodeOne, interestNode));
//				
//			}
			
		}
		
		// Convert list to a JavaPairRDD of edges
		JavaPairRDD<Node, Node> userToInterestEdgesRDD = context.parallelizePairs(listOfUserToInterestEdges);
		
		// Flip above RDD to get reverse edges
		JavaPairRDD<Node, Node> interestToUserEdgesRDD = userToInterestEdgesRDD.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
		
		
		// Part 4: Use the allUsers ArrayList defined in the previous part to query the liked news articles table by user
		// and get all necessary (a, u) / (u, a) edges
		for (int i = 0; i < allUsers.size(); i++) {
			currUser = allUsers.get(i);
			userNodeOne = new Node("user", currUser);
			
			// Initialize the NameMap and ValueMaps for the QuerySpec objects
			NameMap nm = new NameMap();
			nm = nm.with("#u", "user");
			
			ValueMap vm = new ValueMap();
			vm = vm.with(":user", currUser);
			
			QuerySpec qsTwo = new QuerySpec()
				.withKeyConditionExpression("#u = :user")
				.withProjectionExpression("link")
				.withNameMap(nm)
				.withValueMap(vm);
			
			ItemCollection<QueryOutcome> likedArticlesQuery = likedArticles.query(qsTwo);
			Iterator<Item> likedArticlesIter = likedArticlesQuery.iterator();
			
			while (likedArticlesIter.hasNext()) {
				System.out.println("DID WE GET HERE????");
				item = likedArticlesIter.next();
				
				currLink = (String) item.get("link");
				articleNode = new Node("article", currLink);
				
				listOfUserToArticleEdges.add(new Tuple2<>(userNodeOne, articleNode));
				
			}
			
		}
		
		// Convert list to a JavaPairRDD of edges
		JavaPairRDD<Node, Node> userToArticleEdgesRDD = context.parallelizePairs(listOfUserToArticleEdges);
				
		// Flip above RDD to get reverse edges
		JavaPairRDD<Node, Node> articleToUserEdgesRDD = userToArticleEdgesRDD.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
		
		
		// Perform union operations on the articleToUserEdgesRDD / articleToInterestEdgesRDD and the interestToUserEdgesRDD / 
		// interestToArticleEdgesRDD (we will create edgeTransferRDDs from these unioned JavaPairRDDs)
		JavaPairRDD<Node, Node> articleOutgoingEdgesRDD = articleToUserEdgesRDD.union(articleToInterestEdgesRDD);
		JavaPairRDD<Node, Node> interestOutgoingEdgesRDD = interestToUserEdgesRDD.union(interestToArticleEdgesRDD);
		
		
		// We need to calculate the outgoing edge weights for every single type of edge 
		// (including (u, c) / (u, u') / (u, a); (a, c) / (a, u); and (c, a) / (c, u) edges) and store them in 
		// "edgeTransferRDD"-like JavaPairRDDs
		JavaPairRDD<Node, Integer> userToInterestOutgoingEdgeCount = userToInterestEdgesRDD.mapToPair(x -> new Tuple2<>(x._1(), 1))
				.reduceByKey((a, b) -> a + b);
		JavaPairRDD<Node, Double> nodeTransferUserToInterestRDD = userToInterestOutgoingEdgeCount.mapToPair(x -> new Tuple2<>(x._1(), (double) 0.3 / x._2()));
		JavaPairRDD<Node, Tuple2<Node, Double>> edgeTransferUserToInterestRDD = userToInterestEdgesRDD.join(nodeTransferUserToInterestRDD);
		
		
		JavaPairRDD<Node, Integer> friendOutgoingEdgeCount = allFriendEdgesRDD.mapToPair(x -> new Tuple2<>(x._1(), 1))
				.reduceByKey((a, b) -> a + b);
		JavaPairRDD<Node, Double> nodeTransferFriendRDD = friendOutgoingEdgeCount.mapToPair(x -> new Tuple2<>(x._1(), (double) 0.3 / x._2()));
		JavaPairRDD<Node, Tuple2<Node, Double>> edgeTransferFriendRDD = allFriendEdgesRDD.join(nodeTransferFriendRDD);
		
		
		JavaPairRDD<Node, Integer> userToArticleOutgoingEdgeCount = userToArticleEdgesRDD.mapToPair(x -> new Tuple2<>(x._1(), 1))
				.reduceByKey((a, b) -> a + b);
		JavaPairRDD<Node, Double> nodeTransferUserToArticleRDD = userToArticleOutgoingEdgeCount.mapToPair(x -> new Tuple2<>(x._1(), (double) 0.4 / x._2()));
		JavaPairRDD<Node, Tuple2<Node, Double>> edgeTransferUserToArticleRDD = userToArticleEdgesRDD.join(nodeTransferUserToArticleRDD);
		
		
		JavaPairRDD<Node, Integer> articleOutgoingEdgeCount = articleOutgoingEdgesRDD.mapToPair(x -> new Tuple2<>(x._1(), 1))
				.reduceByKey((a, b) -> a + b);
		JavaPairRDD<Node, Double> nodeTransferArticleRDD = articleOutgoingEdgeCount.mapToPair(x -> new Tuple2<>(x._1(), (double) 1.0 / x._2()));
		JavaPairRDD<Node, Tuple2<Node, Double>> edgeTransferArticleRDD = articleOutgoingEdgesRDD.join(nodeTransferArticleRDD);
		
		
		JavaPairRDD<Node, Integer> interestOutgoingEdgeCount = interestOutgoingEdgesRDD.mapToPair(x -> new Tuple2<>(x._1(), 1))
				.reduceByKey((a, b) -> a + b);
		JavaPairRDD<Node, Double> nodeTransferInterestRDD = interestOutgoingEdgeCount.mapToPair(x -> new Tuple2<>(x._1(), (double) 1.0 / x._2()));
		JavaPairRDD<Node, Tuple2<Node, Double>> edgeTransferInterestRDD = interestOutgoingEdgesRDD.join(nodeTransferInterestRDD);
		
		// weightedEdgesRDD is a union of all the "edgeTransferRDD" JavaPairRDDs that stores the exact weight of each edge for all edges
		// in the graph (which will be needed over the course of the adsorption algorithm)
		JavaPairRDD<Node, Tuple2<Node, Double>> weightedEdgesRDD = edgeTransferUserToInterestRDD.union(edgeTransferFriendRDD)
																								.union(edgeTransferUserToArticleRDD)
																								.union(edgeTransferArticleRDD)
																								.union(edgeTransferInterestRDD);
		
		return weightedEdgesRDD;
		
	}
	
	// This method will run the actual adsorption algorithm and recommend a news article for the user currentUser
	public String run(String currentUser) throws IOException, DynamoDbException, InterruptedException {
		
		// Use the createSocialNetwork method to generate weightedEdgesRDD (this should get joined
		// with a JavaPairRDD that contains the user labels/weights)
		JavaPairRDD<Node, Tuple2<Node, Double>> weightedEdgesRDD = createSocialNetwork();
		
		// Extract all unique nodes from the graph
		JavaRDD<Node> allUniqueNodes = weightedEdgesRDD.keys().distinct();
		
		// Make a JavaPairRDD where the HashMap of each node is easily accessible (this will be the equivalent of "SocialRankRDD" in SocialRankJob.java)
		JavaPairRDD<Node, HashMap<String, Double>> nodesAndLabelWeightsRDD = allUniqueNodes.mapToPair(x -> {
			HashMap<String, Double> labelWeights = new HashMap<>();
			if (x.type.equals("user")) {
				labelWeights.put(x.nodeLabel, 1.0);
				
			}
			
			return new Tuple2<>(x, labelWeights);
			
		});
		
		// Initialize a count variable that will run a while loop for at most 15 iterations
		int count = 0;
		
		// Use this to keep track of the number of HashMaps that contain certain strings (this will be used in the normalization step)
		HashMap<String, Integer> userLabelNodeCount = new HashMap<String, Integer>();
		
		// Actual adsorption iteration
		while (count < 15) {
			// Join weightedEdgesRDD and nodesAndHashMapsRDD to get a PairRDD of the follower node and a Tuple2 of both (followed node, edge weight)  and 
			// (follower node user label, user label's corresponding weight)
			JavaPairRDD<Node, Tuple2<Tuple2<Node, Double>, HashMap<String, Double>>> intermediateJoinRDD = weightedEdgesRDD.join(nodesAndLabelWeightsRDD);
			
			// Now, we create propagateRDD(toNode, HM(user label, user weight)), which tells us all the user labels and corresponding user weights that destination
			// nodes receive within a HashMap
			JavaPairRDD<Node, HashMap<String, Double>> propagateRDD = intermediateJoinRDD.mapToPair(pair -> {
				HashMap<String, Double> destUsernameToWeightLabels = new HashMap<>();
				for (Map.Entry<String, Double> entry : pair._2()._2().entrySet()) {
					Double destWeight = entry.getValue() * pair._2()._1()._2();
					destUsernameToWeightLabels.put(entry.getKey(), destWeight);
					
				}
				
				return new Tuple2<>(pair._2()._1()._1(), destUsernameToWeightLabels);
				
			});
			
			// Now, merge the HashMaps of the same key in propagateRDD by adding the labels of the same type that have come from all the different source nodes
			// and store the node and merged HashMaps within nodes
			JavaPairRDD<Node, HashMap<String, Double>> intermediateRDD1 = propagateRDD.reduceByKey((hm1, hm2) -> {
				HashMap<String, Double> hm3 = new HashMap<>(hm1);
				hm2.forEach((k, v) -> hm3.merge(k, v, (v1, v2) -> v1 + v2));

				return hm3;
				
			});
			
			// Set each user's own label to 1 in the above JavaPairRDD, then populate the userLabelNodeCount HashMap for the subsequent normalization step 
			// (these values must be reverted to 0 after every adsorption algorithm iteration because we only want to normalize over those nodes that do 
			// have a given user label at each step)
			JavaPairRDD<Node, HashMap<String, Double>> intermediateRDD2 = intermediateRDD1.mapToPair(pair -> {
				if (pair._1().type.equals("user")) {
					pair._2().put(pair._1().nodeLabel, 1.0);
					
				}
				
				for (String userLabel : pair._2().keySet()) {
					if (!userLabelNodeCount.containsKey(userLabel)) {
						userLabelNodeCount.put(userLabel, 1);
						
					} else {
						Integer currValue = userLabelNodeCount.get(userLabel);
						currValue++;
						userLabelNodeCount.put(userLabel, currValue);
						
					}
					
				}
				
				return pair;
				
			});
			
			// Now, userLabelNodeCount has been fully populated
			
			// Normalize weights so that all user labels' weights add up to 1 across all the nodes where they can be found
			JavaPairRDD<Node, HashMap<String, Double>> intermediateRDD3 = intermediateRDD2.mapToPair(pair -> {
				for (String userLabel : pair._2().keySet()) {
					Integer totalNodeCountForUserLabel = userLabelNodeCount.get(userLabel);
					Double currValue = pair._2().get(userLabel);
					currValue = currValue / totalNodeCountForUserLabel;
					pair._2().put(userLabel, currValue);
					
				}
				
				return pair;
						
			});
			
			
			// Implement cutoff for label propagation (i.e., for each node, if any label in that node's HashMap has a weight
			// less than 0.001, remove that entry from that node's HashMap to prevent its further propagation)
			nodesAndLabelWeightsRDD = intermediateRDD3.mapToPair(pair -> {
				HashMap<String, Double> hmWithCutoff = new HashMap<>(pair._2());
				for (Map.Entry<String, Double> entry : pair._2().entrySet()) {
					if (entry.getValue() < 0.00001) {
						hmWithCutoff.remove(entry.getKey());
						
					}
					
				}
				
				return new Tuple2<Node, HashMap<String, Double>> (pair._1(), hmWithCutoff);
				
			});
			
			// Revert all values within the userLabelNodeCount HashMap back to 0 for the next iteration
			userLabelNodeCount.replaceAll((k, v) -> 0);
			
			// Update counter
			count++;
			
		}
		
		// Perform a DynamoDB query on the news table for all news articles that were published before today (so
		// that we can eliminate those articles and only keep the articles that were published today)
		LocalDate dateObj = LocalDate.now();
		String test = "2022-12-01";
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
		LocalDate d = LocalDate.parse(test);
		DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		String date = d.format(f);
		
		String[] topics = new String[15];
		topics[0] = "POLITICS";
		topics[1] = "WELLNESS";
		topics[2] = "ENTERTAINMENT";
		topics[3] = "TRAVEL";
		topics[4] = "STYLE AND BEAUTY";
		topics[5] = "PARENTING";
		topics[6] = "HEALTHY LIVING";
		topics[7] = "QUEER VOICES";
		topics[8] = "FOOD AND DRINK";
		topics[9] = "BUSINESS";
		topics[10] = "COMEDY";
		topics[11] = "SPORTS";
		topics[12] = "BLACK VOICES";
		topics[13] = "HOME AND LIVING";
		topics[14] = "PARENTS";
		
		ArrayList<Tuple2<Node, Integer>> beforeCurrDateNewsList = new ArrayList<>();
		for (int i = 0; i < 15; i++) {
			QuerySpec qs = new QuerySpec()
					.withKeyConditionExpression("#c = :category and #date < :date")
					.withProjectionExpression("link")
					.withNameMap(new NameMap().with("#c", "category").with("#date", "date"))
					.withValueMap(new ValueMap()
							.withString(":category", topics[i]).withString(":date", date));
			ItemCollection<QueryOutcome> newsQuery = interestsIndex.query(qs);
			Iterator<Item> newsIter = newsQuery.iterator();
			
			while (newsIter.hasNext()) {
				Item item = newsIter.next();
				String currLink = (String) item.get("link");
				
				Node newNode = new Node("article", currLink);
				beforeCurrDateNewsList.add(new Tuple2<>(newNode, 1));
				
			}
		}		
		
		
		
		JavaPairRDD<Node, Integer> beforeCurrDateNewsRDD = context.parallelizePairs(beforeCurrDateNewsList);
		
		// Normalize the weights of the label corresponding to the current user across all article nodes that have that user label
		// after the adsorption algorithm is finished running; then, randomly select an article from that probability distribution 
		// and make an updateItem call to the news table such that the recommended field of the article that was just recommended
		// should now be set to "yes"
		
		// From the JavaPairRDD nodesAndLabelWeightsRDD, get only the elements of the JavaPairRDD whose node type is "article" and
		// whose HashMap contains the key currentUser - if both of these hold, the output JavaPairRDD will contain exactly the 
		// articles that have a label weight above the threshold value for the current user 
		JavaPairRDD<Node, HashMap<String, Double>> relevantArticlesRDD = nodesAndLabelWeightsRDD.filter(pair -> {
			return pair._1().type.equals("article") && pair._2().containsKey(currentUser);
		
		});
		
		// Create a new JavaPairRDD with only the Node object and the weight of the currentUser stored
		JavaPairRDD<Node, Double> relevantArticlesAndWeightRDD = relevantArticlesRDD.mapToPair(pair -> {
			return new Tuple2<>(pair._1(), pair._2().get(currentUser));
			
		});
		
		// We want to remove all articles from relevantArticlesAndWeightRDD that were published before today (because those will not be 
		// recommended)
		JavaPairRDD<Node, Double> currDateRelevantArticlesRDD = relevantArticlesAndWeightRDD.subtractByKey(beforeCurrDateNewsRDD);
		
		// Query the recommendedArticles table to find all articles that have been recommended for the current user
		QuerySpec qsThree = new QuerySpec()
			.withKeyConditionExpression("#user = :user")
			.withProjectionExpression("link")
			.withNameMap(new NameMap().with("#user", "user"))
			.withValueMap(new ValueMap().with(":user", currentUser));
		
		ItemCollection<QueryOutcome> alreadyRecommendedArticles = recommendedArticles.query(qsThree);
		Iterator<Item> alreadyRecommendedArticleIterator = alreadyRecommendedArticles.iterator();
		
		ArrayList<Tuple2<Node, Integer>> alreadyRecommendedArticlesList = new ArrayList<>();
		while (alreadyRecommendedArticleIterator.hasNext()) {
			Item item = alreadyRecommendedArticleIterator.next();
			
			String currLink = (String) item.get("link");
			Node newNode = new Node("article", currLink);
			
			alreadyRecommendedArticlesList.add(new Tuple2<>(newNode, 1));
			
		}
		
		JavaPairRDD<Node, Integer> alreadyRecommendedArticlesRDD = context.parallelizePairs(alreadyRecommendedArticlesList);
		
		// Next, we want to remove from currDateRelevantArticlesRDD all the articles that have already been recommended so that we only normalize
		// over those that haven't yet been recommended and generate the correct probability distribution
		JavaPairRDD<Node, Double> notRecommendedRelevantArticlesRDD = currDateRelevantArticlesRDD.subtractByKey(alreadyRecommendedArticlesRDD);
		
		// Now, we need to normalize the weights of the relevant articles that haven't been recommended by summing all the weights of all the 
		// potential articles and then performing a mapToPair that divides each of the above JavaPairRDD's Double values by the sum calculated
		// above
		Double weightSum = notRecommendedRelevantArticlesRDD.values().aggregate(0.0, (v1, v2) -> v1 + v2, (v3, v4) -> v3 + v4);
		JavaPairRDD<Node, Double> normalizedArticlesRDD = notRecommendedRelevantArticlesRDD.mapToPair(pair -> new Tuple2<>(pair._1(), (pair._2() / weightSum)));
		
		// Collect the probabilities into a list so that they can be iterated over for the random selection of an article
		List<Tuple2<Node, Double>> articleProbabilities = normalizedArticlesRDD.collect();
		System.out.println("Size of list of articles to recommend: ");
		System.out.println(articleProbabilities.size());
		
		// Select an article node at random from the above JavaPairRDD, then make a putItem call that adds the recommended article into the recommendedArticles table
		// for the current user
		double p = Math.random();
		double cumulativeProb = 0.0;
		
		Node chosenArticle = new Node("article", "dummy_link");
		
		for (Tuple2<Node, Double> pair : articleProbabilities) {
			cumulativeProb += pair._2();
			System.out.println(cumulativeProb);
			
			if (p <= cumulativeProb) {
				chosenArticle = pair._1();
				break;
				
			}
			
		}
		
		// Extract the link of the chosen news article from the Node object
		String chosenLink = chosenArticle.nodeLabel;
		
		// Create an item that will then be put into the recommendedArticles table and send this news article
		// to the client side (where its info will be populated in the news feed)
		Item selectedArticle = new Item()
			.withPrimaryKey("user", currentUser, "link", chosenLink);
		
		recommendedArticles.putItem(selectedArticle);
		System.out.println("PRINTING CHOSEN LINK");
		System.out.println(chosenLink);
		return chosenLink;
		
	}
	
	public void shutdown() {
		DynamoConnector.shutdown();
		
		if (spark != null) {
			spark.close();
			
		}
		
	}
	
	public AdsorptionJob(String currentUser) {
		System.setProperty("file.encoding", "UTF-8");
		
		this.currentUser = currentUser;
		
	}
	
	
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		final AdsorptionJob aj = new AdsorptionJob(args[0]);
		
		try {
			aj.initialize();
			
			// Run the run function with the first command-line argument, which will be the current user
			aj.run(args[0]);
			
		} catch (final IOException e) {
			e.printStackTrace();
		} catch (final InterruptedException e) {
			e.printStackTrace();
		} catch (final DynamoDbException e) {
			e.printStackTrace();
		} finally {
			aj.shutdown();
		}

	}
	
	@Override
	public String call(JobContext arg0) throws Exception {
		initialize();
		return run(this.currentUser);
	}
	

}
