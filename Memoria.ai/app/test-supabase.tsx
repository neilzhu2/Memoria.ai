import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [results, setResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log('[TEST]', message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthSession = async () => {
    addLog('Testing auth session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Auth session ERROR: ${error.message}`);
      } else {
        addLog(`✅ Auth session OK: User ${data.session?.user?.id || 'NONE'}`);
      }
    } catch (err) {
      addLog(`❌ Auth session EXCEPTION: ${err}`);
    }
  };

  const testSimpleSelect = async () => {
    addLog('Testing simple SELECT COUNT(*)...');
    try {
      const startTime = Date.now();
      const { data, error, count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: false });

      const duration = Date.now() - startTime;

      if (error) {
        addLog(`❌ SELECT ERROR (${duration}ms): ${error.message}`);
        addLog(`   Details: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ SELECT OK (${duration}ms): Found ${data?.length || 0} rows`);
        if (data && data.length > 0) {
          addLog(`   First row: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
      }
    } catch (err: any) {
      addLog(`❌ SELECT EXCEPTION: ${err.message || err}`);
    }
  };

  const testInsert = async () => {
    addLog('Testing INSERT...');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        addLog('❌ No session - cannot test insert');
        return;
      }

      const startTime = Date.now();
      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: session.session.user.id,
          title: 'Test Insert ' + Date.now(),
          description: 'Test from diagnostic screen',
          audio_url: 'test://url',
          duration: 10,
          date: new Date().toISOString(),
          theme: 'test',
          is_shared: false,
        })
        .select()
        .single();

      const duration = Date.now() - startTime;

      if (error) {
        addLog(`❌ INSERT ERROR (${duration}ms): ${error.message}`);
        addLog(`   Details: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ INSERT OK (${duration}ms): Created ID ${data?.id}`);
      }
    } catch (err: any) {
      addLog(`❌ INSERT EXCEPTION: ${err.message || err}`);
    }
  };

  const testNetworkFetch = async () => {
    addLog('Testing raw fetch to Supabase...');
    try {
      const startTime = Date.now();
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
      const duration = Date.now() - startTime;
      addLog(`✅ Raw fetch OK (${duration}ms): Status ${response.status}`);
    } catch (err: any) {
      addLog(`❌ Raw fetch EXCEPTION: ${err.message || err}`);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    addLog('=== STARTING SUPABASE DIAGNOSTIC TESTS ===');
    await testNetworkFetch();
    await testAuthSession();
    await testSimpleSelect();
    addLog('=== ALL TESTS COMPLETE ===');
    addLog('');
    addLog('If network test passes but SELECT fails, there is a Supabase PostgREST configuration issue.');
    addLog('If auth session shows no user, try logging in first from the welcome screen.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runAllTests}>
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNetworkFetch}>
          <Text style={styles.buttonText}>Test Network</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testAuthSession}>
          <Text style={styles.buttonText}>Test Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSimpleSelect}>
          <Text style={styles.buttonText}>Test SELECT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testInsert}>
          <Text style={styles.buttonText}>Test INSERT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={() => setResults([])}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  results: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  resultText: {
    fontFamily: 'Courier',
    fontSize: 12,
    marginBottom: 5,
  },
});
