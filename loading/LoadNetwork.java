package main.java.edu.upenn.cis.nets2120.loading;

import java.io.BufferedReader;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Paths;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.PairFunction;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.RowFactory;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.catalyst.expressions.GenericRowWithSchema;
import org.apache.spark.sql.types.StructType;

import com.amazonaws.services.dynamodbv2.document.BatchWriteItemOutcome;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.TableWriteItems;
import com.amazonaws.services.dynamodbv2.document.UpdateItemOutcome;
import com.amazonaws.services.dynamodbv2.model.AttributeDefinition;
import com.amazonaws.services.dynamodbv2.model.KeySchemaElement;
import com.amazonaws.services.dynamodbv2.model.KeyType;
import com.amazonaws.services.dynamodbv2.model.ProvisionedThroughput;
import com.amazonaws.services.dynamodbv2.model.ResourceInUseException;
import com.amazonaws.services.dynamodbv2.model.ScalarAttributeType;
import com.amazonaws.services.dynamodbv2.model.WriteRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVParser;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.opencsv.stream.reader.LineReader;

import main.java.edu.upenn.cis.nets2120.config.Config;
import main.java.edu.upenn.cis.nets2120.storage.DynamoConnector;
import main.java.edu.upenn.cis.nets2120.storage.SparkConnector;
import opennlp.tools.stemmer.PorterStemmer;
import opennlp.tools.stemmer.Stemmer;
import opennlp.tools.tokenize.SimpleTokenizer;
import scala.Tuple2;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

public class LoadNetwork {
	public class strAndUrl {
	String url;
	ArrayList<String> keywords;
	public strAndUrl(String link, ArrayList<String> words) {
		keywords = new ArrayList<String>();
		keywords = words;
		url = link;
	}
	}
	public class elm {
		String url;
		String keyword;
		public elm(String link, String word) {
			keyword = word;
			url = link;
		}
	}
	/**
	 * The basic logger
	 */
	static Logger logger = LogManager.getLogger(LoadNetwork.class);

	/**
	 * Connection to DynamoDB
	 */
	DynamoDB db;
	Table news;
	Stemmer stemmer;
	Table inverted;
	CSVParser parser;
	Table friends;
	Table posts;
	Table users;
	Table chatrooms;
	Table chats;
	Table chatnotifs;
	Table groupchats;
	Table groupchatsById;
	Table comments;
	
	
	/**
	 * Connection to Apache Spark
	 */
	SparkSession spark;
	
	JavaSparkContext context;
	
	/**
	 * Helper function: swap key and value in a JavaPairRDD
	 * 
	 * @author zives
	 *
	 */
	static class SwapKeyValue<T1,T2> implements PairFunction<Tuple2<T1,T2>, T2,T1> {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		@Override
		public Tuple2<T2, T1> call(Tuple2<T1, T2> t) throws Exception {
			return new Tuple2<>(t._2, t._1);
		}
		
	}
	
	
	public LoadNetwork() {
		System.setProperty("file.encoding", "UTF-8");
		parser = new CSVParser();
	}
	
	private void initializeTables() throws DynamoDbException, InterruptedException {
		try {
			groupchats = db.createTable("groupchats", Arrays.asList(new KeySchemaElement("user", KeyType.HASH),
					new KeySchemaElement("timestamp", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("user", ScalarAttributeType.S),
							new AttributeDefinition("timestamp", ScalarAttributeType.N)), 
					new ProvisionedThroughput(25L, 25L));
			
			System.out.println("created groupchats table");
			
			groupchats.waitForActive();
		} catch (final ResourceInUseException exists) {
			groupchats = db.getTable("groupchats");
		}
		try {
			groupchatsById = db.createTable("groupchatsById", Arrays.asList(new KeySchemaElement("roomId", KeyType.HASH),
					new KeySchemaElement("user", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("roomId", ScalarAttributeType.S),
							new AttributeDefinition("user", ScalarAttributeType.S)), 
					new ProvisionedThroughput(25L, 25L));
			
			System.out.println("created ID table");
			
			groupchatsById.waitForActive();
		} catch (final ResourceInUseException exists) {
			groupchatsById = db.getTable("groupchatsById");
		}
		try {
			chatrooms = db.createTable("chatrooms", Arrays.asList(new KeySchemaElement("roomId", KeyType.HASH), new KeySchemaElement("user", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("roomId", ScalarAttributeType.S), 
							new AttributeDefinition("user", ScalarAttributeType.S)), 
					new ProvisionedThroughput(25L, 25L));
			
			System.out.println("created chatrooms table");
			
			chatrooms.waitForActive();
		} catch (final ResourceInUseException exists) {
			chatrooms = db.getTable("chatrooms");
		}
		try {
			chatnotifs = db.createTable("chatnotifs", Arrays.asList(new KeySchemaElement("receivedByUser", KeyType.HASH), new KeySchemaElement("fromUser", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("receivedByUser", ScalarAttributeType.S), 
							new AttributeDefinition("fromUser", ScalarAttributeType.S)), 
					new ProvisionedThroughput(25L, 25L));
		
			
			chatnotifs.waitForActive();
		} catch (final ResourceInUseException exists) {
			chatnotifs = db.getTable("chatnotifs");
		}
		try {
			chats = db.createTable("chats", Arrays.asList(new KeySchemaElement("roomId", KeyType.HASH),
					new KeySchemaElement("timestamp", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("roomId", ScalarAttributeType.S),
							new AttributeDefinition("timestamp", ScalarAttributeType.N)), 
					new ProvisionedThroughput(25L, 25L));
			
			System.out.println("created chats table");
			
			chats.waitForActive();
		} catch (final ResourceInUseException exists) {
			chats = db.getTable("chats");
		}
		try {
			friends = db.createTable("friends", Arrays.asList(new KeySchemaElement("friend1", KeyType.HASH),
					new KeySchemaElement("friend2", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("friend1", ScalarAttributeType.S),
							new AttributeDefinition("friend2", ScalarAttributeType.S)), 
					new ProvisionedThroughput(25L, 25L));
			
			System.out.println("created friends table");
			
			friends.waitForActive();
		} catch (final ResourceInUseException exists) {
			friends = db.getTable("friends");
		}
		
		try {
			posts = db.createTable("posts", Arrays.asList(new KeySchemaElement("username", KeyType.HASH),
					new KeySchemaElement("timestamp", KeyType.RANGE)),
					Arrays.asList(new AttributeDefinition("username", ScalarAttributeType.S),
							new AttributeDefinition("timestamp", ScalarAttributeType.S)), 
					new ProvisionedThroughput(25L, 25L));
			System.out.println("created posts table");
			
			posts.waitForActive();
		} catch (final ResourceInUseException exists) {
			posts = db.getTable("posts");
		}
		
		try {
			news = db.createTable("news", Arrays.asList(new KeySchemaElement("link", KeyType.HASH)), // Partition
					// key
					Arrays.asList(new AttributeDefinition("link", ScalarAttributeType.S)),
					new ProvisionedThroughput(25L, 25L)); // Stay within the free tier
			System.out.println("created news table");
			
			news.waitForActive();
		} catch (final ResourceInUseException exists) {
			news = db.getTable("news");
		}
		
		try {
			inverted = db.createTable("inverted", Arrays.asList(new KeySchemaElement("keyword", KeyType.HASH), // Partition
					// key
					new KeySchemaElement("link", KeyType.RANGE)), // Partition
					// key
					Arrays.asList(new AttributeDefinition("keyword", ScalarAttributeType.S),
					new AttributeDefinition("link", ScalarAttributeType.S)),
					new ProvisionedThroughput(25L, 25L));

			System.out.println("created inverted table");
					
			inverted.waitForActive();
		} catch (final ResourceInUseException exists) {
			inverted = db.getTable("inverted");
		}
		
		try {
			users = db.createTable("users", Arrays.asList(new KeySchemaElement("username", KeyType.HASH)), 
					Arrays.asList(new AttributeDefinition("username", ScalarAttributeType.S)),
					new ProvisionedThroughput(25L, 25L));
			System.out.println("created users table");
		} catch (final ResourceInUseException exists) {
			users = db.getTable("users");
		}
		
		try {
			comments = db.createTable("comments", Arrays.asList(new KeySchemaElement("post_id", KeyType.HASH), // Partition
					// key
					new KeySchemaElement("timestamp", KeyType.RANGE)), // Partition
					// key
					Arrays.asList(new AttributeDefinition("post_id", ScalarAttributeType.S),
					new AttributeDefinition("timestamp", ScalarAttributeType.S)),
					new ProvisionedThroughput(25L, 25L));

			System.out.println("created comments table");
					
			inverted.waitForActive();
		} catch (final ResourceInUseException exists) {
			inverted = db.getTable("comments");
		}
	}
	

	/**
	 * Initialize the database connection and open the file
	 * 
	 * @throws IOException
	 * @throws InterruptedException 
	 * @throws DynamoDbException 
	 */
	public void initialize() throws IOException, DynamoDbException, InterruptedException {
		logger.info("Connecting to DynamoDB...");
		db = DynamoConnector.getConnection("https://dynamodb.us-east-1.amazonaws.com");
		
		spark = SparkConnector.getSparkConnection();
		context = SparkConnector.getSparkContext();
		
		initializeTables();
		
		logger.debug("Connected!");
	}
	
	/**
	 * Fetch the social network from the S3 path, and create a (followed, follower) edge graph
	 * 
	 * @param filePath
	 * @return JavaPairRDD: (followed: int, follower: int)
	 */
	strAndUrl getInvertedFormat(String line) {
		strAndUrl toRet = null;
		stemmer = new PorterStemmer();
		Set<String> theWordsToAdd = new HashSet<String>();
		ObjectMapper obj = new ObjectMapper();
			JsonFactory factory = obj.getFactory();  
            JsonParser parser;
				try {
					parser = factory.createParser(line);
					JsonNode node = obj.readTree(parser); 
					String url = node.get("link").textValue();
					String[] headlineKeywords = node.get("headline").textValue().split(" ");
					String[] sdKeyWords = node.get("short_description").textValue().split(" ");
					for (String s: headlineKeywords) {
						if (s.matches("[a-zA-Z]+")) {
							String toW = s.toLowerCase();
							if (!(toW.equals("a") || 
									toW.equals("all") 
									|| toW.equals("any") 
									|| toW.equals("but") 
									|| toW.equals("the"))) {
								String str = stemmer.stem(toW).toString();
								//String str = stemmer.stem(toW).toString();
								theWordsToAdd.add(str);
		        	}
						}
					}
					for (String s: sdKeyWords) {
						if (s.matches("[a-zA-Z]+")) {
							String toW = s.toLowerCase();
							if (!(toW.equals("a") || 
									toW.equals("all") 
									|| toW.equals("any") 
									|| toW.equals("but") 
									|| toW.equals("the"))) {
								String str = stemmer.stem(toW).toString();
								theWordsToAdd.add(str);
		        	}
						}
					}
					ArrayList<String> theList = new ArrayList<String>();
					for (String s: theWordsToAdd) {
						theList.add(s);
					}
					toRet = new strAndUrl(url, theList);
					//return toRet;
				}
				catch (Exception e) {
					System.err.println("Failed to retrieve items: ");
					e.printStackTrace(System.err);
				}
			
				return toRet;

	}
	/*
	void writeToInverted(String line) {
		try {
			inverted = db.createTable("inverted", Arrays.asList(new KeySchemaElement("keyword", KeyType.HASH), // Partition
					// key
new KeySchemaElement("inxid", KeyType.RANGE)), // Partition
					// key
Arrays.asList(new AttributeDefinition("keyword", ScalarAttributeType.S),
		new AttributeDefinition("inxid", ScalarAttributeType.S)),
new ProvisionedThroughput(25L, 25L));

			inverted.waitForActive();
		} catch (final ResourceInUseException exists) {
			inverted = db.getTable("inverted");
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		UUID uuid = UUID.randomUUID();
        String uuidAsString = uuid.toString();
		stemmer = new PorterStemmer();
		TreeSet<String> theWordsToAdd = new TreeSet<String>();
		ObjectMapper obj = new ObjectMapper();
			JsonFactory factory = obj.getFactory();  
            JsonParser parser;
				try {
					parser = factory.createParser(line);
					JsonNode node = obj.readTree(parser); 
					String url = node.get("link").textValue();
					String[] headlineKeywords = node.get("headline").textValue().split(" ");
					String[] sdKeyWords = node.get("short_description").textValue().split(" ");
					for (String s: headlineKeywords) {
						if (s.matches("[a-zA-Z]+")) {
							String toW = s.toLowerCase();
							if (!(toW.equals("a") || 
									toW.equals("all") 
									|| toW.equals("any") 
									|| toW.equals("but") 
									|| toW.equals("the"))) {
								String str = stemmer.stem(toW).toString();
								//String str = stemmer.stem(toW).toString();
								theWordsToAdd.add(str);
		        	}
						}
					}
					for (String s: sdKeyWords) {
						if (s.matches("[a-zA-Z]+")) {
							String toW = s.toLowerCase();
							if (!(toW.equals("a") || 
									toW.equals("all") 
									|| toW.equals("any") 
									|| toW.equals("but") 
									|| toW.equals("the"))) {
								String str = stemmer.stem(toW).toString();
								theWordsToAdd.add(str);
		        	}
						}
					}
					ArrayList<String> theList = new ArrayList<String>();
					for (String s: theWordsToAdd) {
						theList.add(s);
					}
					int number = 0;
			        int i = 1;
			        while (number < theList.size()) {
			        	ArrayList<Item> items = new ArrayList<Item>();
			        	//Ensuring that db.batchWriteItem only writes 
			        	 // max of 25 items every time it is called
			        	while (number < 25*i && number < theList.size()) {
			        		items.add(new Item().withPrimaryKey("keyword", 
			        				theList.get(number), "inxid", 
			        				uuidAsString).withJSON("url", "\""+url+"\""));
			        		number++;
			        	}
			        	//incrementing i to get the next 25 items to write
			        	i++;
			        	try {
			                TableWriteItems forumTableWriteItems = new TableWriteItems("inverted") // Forum
			                        .withItemsToPut(items);
			                BatchWriteItemOutcome outcome = db.batchWriteItem(forumTableWriteItems);
			                //taking care of unprocessed items
			                do {
			              
			                    Map<String, List<WriteRequest>> unprocessedItems = outcome.getUnprocessedItems();

			                    if (outcome.getUnprocessedItems().size() == 0) {
			                        System.out.println("Changing this! items found");
			                    }
			                    else {
			                        System.out.println("Retrieving the unprocessed items");
			                        outcome = db.batchWriteItemUnprocessed(unprocessedItems);
			                    }

			                } while (outcome.getUnprocessedItems().size() > 0);

			            }
			            catch (Exception e) {
			                System.err.println("Failed to retrieve items: ");
			                e.printStackTrace(System.err);
			            
			        	
			        	
			        }
			        }
					
				} catch (JsonParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	}*/
	/**
	 * Returns an RDD of parsed talk data
	 * 
	 * @param filePath
	 * @return
	 * @throws IOException
	 */
	JavaRDD<Row> getNewsFeed() throws IOException {
		String filePath = "/target/News_Category_Dataset_v3.json";
		LineReader reader = null;
		BufferedReader fil = null;
		//List to store each line from the file
		List<String> lines = new ArrayList<String>();
		List<String> columnNames = new ArrayList<String>();
		try {
//			byte[] mapData = Files.readAllBytes(Paths.get(filePath));
//			Map<String,String> myMap = new HashMap<String, String>();
//
//			ObjectMapper objectMapper = new ObjectMapper();
//			myMap = objectMapper.readValue(mapData, HashMap.class);
//			System.out.println("Map is: "+myMap);
					
			fil = new BufferedReader(new FileReader(new File(Config.NEWS_TALK_PATH)));
			reader = new LineReader(fil, true);
//			// Read + ignore header
			String nextLine = null;
			try {
				do {
					nextLine = reader.readLine();
					if (nextLine != null) {
						//storing the lines in the file
						//writeToInverted(nextLine);
						lines.add(nextLine);
					}					
				} while (nextLine != null);
			} catch (IOException e) {
				e.printStackTrace();
			}}
		 finally {
			if (reader != null)
//				reader.close();
			
			if (fil != null)
				fil.close();
		}
		final StructType rowSchema = new StructType()
				.add("link", "string")
				.add("category", "string")
				.add("headline", "string")
				.add("short_description", "string")
				.add("authors", "string")
				.add("date", "string");
		ObjectMapper obj = new ObjectMapper();
		List<Row> listOfStrings = lines.parallelStream().map(str -> {
		//defining each row to the particular columns
			Object[] row = new Object[6];
			JsonFactory factory = obj.getFactory();  
            // create parser by using the createParser() method  
            JsonParser parser;
			try {
				parser = factory.createParser(str);
				JsonNode node = obj.readTree(parser); 
				String[] date = node.get("date").textValue().split("-");
				int oldDate = Integer.parseInt(date[0]);
				int newDate = oldDate+5;
				date[0] = String.valueOf(newDate);
				String newd = String.join("-", date);
				row[0] = node.get("link").textValue();
				row[1] = node.get("category").textValue();
				row[2] = node.get("headline").textValue();
				row[3] = node.get("short_description").textValue();
				row[4] = node.get("authors").textValue();
				row[5] = newd;
				
				
			} catch (JsonParseException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}  
            // create JsonNode from parser  
        
		
		return new GenericRowWithSchema(row, rowSchema);
		}).collect(Collectors.toList());	
		JavaRDD<Row> rowsOfData = context.parallelize(listOfStrings);
		return rowsOfData;

	}

	/**
	 * Returns an RDD of parsed talk data
	 * 
	 * @param filePath
	 * @return
	 * @throws IOException
	 */
	JavaRDD<Row> getKeywords() throws IOException {
		String filePath = "/target/News_Category_Dataset_v3.json";
		LineReader reader = null;
		BufferedReader fil = null;
		//List to store each line from the file
		List<strAndUrl> lines = new ArrayList<strAndUrl>();
		List<elm> keywordLines = new ArrayList<elm>();
		List<String> columnNames = new ArrayList<String>();
		try {
//			byte[] mapData = Files.readAllBytes(Paths.get(filePath));
//			Map<String,String> myMap = new HashMap<String, String>();
//
//			ObjectMapper objectMapper = new ObjectMapper();
//			myMap = objectMapper.readValue(mapData, HashMap.class);
//			System.out.println("Map is: "+myMap);
					
			fil = new BufferedReader(new FileReader(new File(Config.NEWS_TALK_PATH)));
			reader = new LineReader(fil, true);
//			// Read + ignore header
			String nextLine = null;
			try {
				do {
					nextLine = reader.readLine();
					if (nextLine != null) {
						//storing the lines in the file
						
						strAndUrl sU = getInvertedFormat(nextLine);
						for (String word: sU.keywords) {
							elm element = new elm(sU.url, word);
							keywordLines.add(element);
						}
					}					
				} while (nextLine != null);
			} catch (IOException e) {
				e.printStackTrace();
			}}
		 finally {
			if (reader != null)
//				reader.close();
			
			if (fil != null)
				fil.close();
		}
		final StructType rowSchema = new StructType()
				.add("keyword", "string")
				.add("link", "string");
		
		ObjectMapper obj = new ObjectMapper();
		List<Row> listOfStrings = keywordLines.parallelStream().map(elm -> {
		//defining each row to the particular columns
			Object[] row = new Object[2];
			row[0] = elm.keyword;
			row[1] = elm.url;
			
            // create JsonNode from parser  
        
		return new GenericRowWithSchema(row, rowSchema); 
		}).collect(Collectors.toList());	
		
		JavaRDD<Row> rowsOfData = context.parallelize(listOfStrings, 10);
		return rowsOfData;

	}
	
	
	/**
	 * Main functionality in the program: read and process the social network
	 * 
	 * @throws IOException File read, network, and other errors
	 * @throws DynamoDbException DynamoDB is unhappy with something
	 * @throws InterruptedException User presses Ctrl-C
	 */
	public void run() throws IOException, DynamoDbException, InterruptedException {
		logger.info("Running");

		// Load + store the TED talks
		//JavaRDD<Row> newsArticles = this.getNewsFeed();
		JavaRDD<Row> keywords = this.getKeywords();
		// Load the social network
		//(Node ID, count)
		//int newsCount = 0;
		//int keywordCount = 0;
	/* ALREADY DONE DO NOT REUPLOAD
		newsArticles.foreachPartition(iter -> {
			//need to define new connection to the Dynamodb
			DynamoDB db;
			Table news;
			db = DynamoConnector.getConnection(Config.DYNAMODB_URL);
			try {
				news = db.createTable("news", Arrays.asList(new KeySchemaElement("link", KeyType.HASH)), // Partition
																													// key
						Arrays.asList(new AttributeDefinition("link", ScalarAttributeType.S)),
						new ProvisionedThroughput(25L, 25L)); // Stay within the free tier

				news.waitForActive();
			} catch (final ResourceInUseException exists) {
				news = db.getTable("news");
			}
		while (iter.hasNext()) {
			//newsCount++;
			ArrayList<Item> items = new ArrayList<Item>();
			for (int i = 0; i < 25; i++) {
				if (!iter.hasNext()) {
					break;
				}
				
				Row row = iter.next();
				items.add(new Item().withPrimaryKey("link", row.getAs("link"))
						.withString("category", row.getAs("category"))
						.withString("headline", row.getAs("headline"))
						.withString("short_description", row.getAs("short_description"))
						.withString("authors", row.getAs("authors"))
						.withString("date", row.getAs("date")));
				System.out.println(row.getAs("link").toString());
			}
			
			try {
                TableWriteItems forumTableWriteItems = new TableWriteItems("news") // Forum
                        .withItemsToPut(items);
                BatchWriteItemOutcome outcome = db.batchWriteItem(forumTableWriteItems);
                //taking care of unprocessed items
                do {
              
                    Map<String, List<WriteRequest>> unprocessedItems = outcome.getUnprocessedItems();

                    if (outcome.getUnprocessedItems().size() == 0) {
                        System.out.println("no unprocessed items found");
                    }
                    else {
                        System.out.println("Retrieving the unprocessed items");
                        outcome = db.batchWriteItemUnprocessed(unprocessedItems);
                    }

                } while (outcome.getUnprocessedItems().size() > 0);

            }
            catch (Exception e) {
                System.err.println("Failed to retrieve items: ");
                e.printStackTrace(System.err);
            }
			
			System.out.println("Adding items to news table");
			}
		}
		);
*/
		//int keywordCount = 0;
		/*
		keywords.foreachPartition(iter -> {
			//need to define new connection to the Dynamodb
			DynamoDB db;
			Table inverted;
			db = DynamoConnector.getConnection(Config.DYNAMODB_URL);
			try {
				System.out.print("we are here");
				inverted = db.createTable("inverted", Arrays.asList(new KeySchemaElement("keyword", KeyType.HASH), 
				new KeySchemaElement("link", KeyType.RANGE )), // Partition
																													// key
						Arrays.asList(new AttributeDefinition("keyword", ScalarAttributeType.S),
						new AttributeDefinition("link", ScalarAttributeType.S)),
						new ProvisionedThroughput(25L, 25L));
				inverted.waitForActive();
			} catch (final ResourceInUseException exists) {
				inverted = db.getTable("inverted");
			}
			
		while (iter.hasNext()) {
			//keywordCount++;
			ArrayList<Item> l = new ArrayList<Item>();
			for (int i = 0; i < 25; i++) {
				if (!iter.hasNext()) {
					break;
				}
				
				Row row = iter.next();
				
				l.add(new Item().withPrimaryKey("keyword", row.getAs("keyword").toString())
						.withString("link", row.getAs("link").toString()));
				
				System.out.println(row.getAs("keyword").toString());
				System.out.println(row.getAs("link").toString());
			}
			
			try {
                TableWriteItems forumTableWriteItems = new TableWriteItems("inverted") // Forum
                        .withItemsToPut(l);
                BatchWriteItemOutcome outcome = db.batchWriteItem(forumTableWriteItems);
                //taking care of unprocessed items
                do {
              
                    Map<String, List<WriteRequest>> unprocessedItems = outcome.getUnprocessedItems();

                    if (outcome.getUnprocessedItems().size() == 0) {
                        System.out.println("no unprocessed items found");
                    }
                    else {
                        System.out.println("Retrieving the unprocessed items");
                        outcome = db.batchWriteItemUnprocessed(unprocessedItems);
                    }

                } while (outcome.getUnprocessedItems().size() > 0);

            }
            catch (Exception e) {
                System.err.println("Failed to retrieve items: ");
                e.printStackTrace(System.err);
            }
			
			//writing items to the dynamodb
			/*inverted.putItem(new Item().withPrimaryKey("keyword", row.getAs("keyword"))
			.withString("link", row.getAs("link")));*/
			//System.out.println("Adding items to inverted table");
					
		//}
	//}
	//);
		//zipping with indices

	}

	/**
	 * Graceful shutdown
	 */
	public void shutdown() {
		logger.info("Shutting down");
		
		DynamoConnector.shutdown();
		
		if (spark != null)
			spark.close();
	}
	
	public static void main(String[] args) {
		final LoadNetwork ln = new LoadNetwork();

		try {
			ln.initialize();

			//ln.run();
		} catch (final IOException ie) {
			logger.error("I/O error: ");
			ie.printStackTrace();
		} catch (final DynamoDbException e) {
			e.printStackTrace();
		} catch (final InterruptedException e) {
			e.printStackTrace();
		} finally {
			ln.shutdown();
		}
	}

}

