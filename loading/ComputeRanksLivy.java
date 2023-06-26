package main.java.edu.upenn.cis.nets2120.loading;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.livy.LivyClient;
import org.apache.livy.LivyClientBuilder;

import main.java.edu.upenn.cis.nets2120.config.Config;

public class ComputeRanksLivy {

	public static void main(String[] args) throws IOException, URISyntaxException, InterruptedException, ExecutionException {
		// TODO Auto-generated method stub
		LivyClient client = new LivyClientBuilder()
				  .setURI(new URI("#Add Livy EC2 URI here"))
				  .build();
		
		try {
			// Generate jar file by storing class files within the same subdirectory, then running
			// "jar cvf jarfile.jar"
			String jar = "path/to/jar.jar";
			
			// This will be replaced by the user currently logged in and will be conducted either on the hour
			// when this user changes their interests
			String currentUser = "";
			
			System.out.printf("Uploading %s to the Spark context...\n", jar);
			client.uploadJar(new File(jar)).get();
			
			String result = client.submit(new AdsorptionJob(currentUser)).get();
			
			
		} finally {
			client.stop(true);
		}
	}
}
